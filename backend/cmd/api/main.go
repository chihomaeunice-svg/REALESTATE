package main

import (
	"context"
	"log"
	"net/http"

	"realestate-backend/internal"
	"realestate-backend/internal/config"
	"realestate-backend/internal/db"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	router := internal.NewRouter(pool, cfg.JWTSecret)

	log.Printf("Nyumba Yangu API listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, router); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
