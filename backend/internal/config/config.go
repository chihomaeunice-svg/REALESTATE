package config

import "os"

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	ResendAPIKey     string
	SnippeAPIKey     string
	SnippeWebhookKey string
	BaseURL          string
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func Load() Config {
	return Config{
		Port:             getenv("PORT", "8080"),
		DatabaseURL:      getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/realestate?sslmode=disable"),
		JWTSecret:        getenv("JWT_SECRET", "dev-secret-change-in-production"),
		ResendAPIKey:     getenv("RESEND_API_KEY", ""),
		SnippeAPIKey:     getenv("SNIPPE_API_KEY", ""),
		SnippeWebhookKey: getenv("SNIPPE_WEBHOOK_KEY", ""),
		BaseURL:          getenv("BASE_URL", "https://api.nyumbayangu.online"),
	}
}
