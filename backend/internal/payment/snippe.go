package payment

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
)

const snippeBaseURL = "https://api.snippe.co.tz/v1"

type SnippeClient struct {
	APIKey     string
	WebhookKey string
}

type CreatePaymentRequest struct {
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	PhoneNumber    string  `json:"phone_number"`
	IdempotencyKey string  `json:"idempotency_key"`
	CallbackURL    string  `json:"callback_url"`
	Description    string  `json:"description"`
}

type CreatePaymentResponse struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	Reference string `json:"reference"`
}

type PaymentStatusResponse struct {
	ID        string `json:"id"`
	Status    string `json:"status"`
	Reference string `json:"reference"`
}

func (c *SnippeClient) CreatePayment(req CreatePaymentRequest) (*CreatePaymentResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", snippeBaseURL+"/payments", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+c.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return nil, fmt.Errorf("snippe error %d: %v", resp.StatusCode, errResp)
	}

	var result CreatePaymentResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *SnippeClient) GetPaymentStatus(paymentID string) (*PaymentStatusResponse, error) {
	httpReq, err := http.NewRequest("GET", snippeBaseURL+"/payments/"+paymentID, nil)
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Authorization", "Bearer "+c.APIKey)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("snippe error %d", resp.StatusCode)
	}

	var result PaymentStatusResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *SnippeClient) VerifyWebhookSignature(payload []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(c.WebhookKey))
	mac.Write(payload)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
