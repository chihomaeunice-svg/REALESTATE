package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"realestate-backend/internal/httpx"
)

type UploadHandler struct{}

const maxUploadSize = 5 << 20 // 5 MB

// allowedTypes maps MIME type to file extension.
var allowedTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

// Upload handles POST /api/uploads.
// Accepts multipart/form-data with a single field "image".
// Validates file type (JPEG/PNG/WebP) and size (max 5 MB).
// Saves to ./uploads/{random}.{ext} and returns the URL path.
func (h *UploadHandler) Upload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize+1024) // small overhead for multipart headers

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		httpx.Error(w, http.StatusBadRequest, "file too large (max 5 MB)")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "missing image field")
		return
	}
	defer file.Close()

	if header.Size > maxUploadSize {
		httpx.Error(w, http.StatusBadRequest, "file too large (max 5 MB)")
		return
	}

	// Detect content type from file header bytes.
	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		httpx.Error(w, http.StatusBadRequest, "could not read file")
		return
	}
	contentType := http.DetectContentType(buf[:n])

	ext, ok := allowedTypes[contentType]
	if !ok {
		httpx.Error(w, http.StatusBadRequest, "unsupported file type; allowed: JPEG, PNG, WebP")
		return
	}

	// Seek back to the beginning so we copy the full file.
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "internal error")
		return
	}

	// Generate a random filename.
	randBytes := make([]byte, 16)
	if _, err := rand.Read(randBytes); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "internal error")
		return
	}
	filename := hex.EncodeToString(randBytes) + ext

	// Ensure uploads directory exists.
	uploadsDir := "uploads"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not create uploads directory")
		return
	}

	destPath := filepath.Join(uploadsDir, filename)
	dest, err := os.Create(destPath)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not save file")
		return
	}
	defer dest.Close()

	if _, err := io.Copy(dest, file); err != nil {
		os.Remove(destPath)
		httpx.Error(w, http.StatusInternalServerError, "could not save file")
		return
	}

	url := "/uploads/" + filename
	httpx.JSON(w, http.StatusCreated, map[string]string{"url": url})
}
