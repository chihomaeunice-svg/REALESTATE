package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type Client struct {
	APIKey string
	From   string
}

func NewClient(apiKey string) *Client {
	return &Client{
		APIKey: apiKey,
		From:   "Nyumba Yangu <noreply@nyumbayangu.online>",
	}
}

type sendRequest struct {
	From    string `json:"from"`
	To      []string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

func (c *Client) SendOTP(to, code string) error {
	body := sendRequest{
		From:    c.From,
		To:      []string{to},
		Subject: "Your Nyumba Yangu login code: " + code,
		HTML: fmt.Sprintf(`
			<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
				<h2 style="color:#1a1a1a;margin-bottom:8px">Nyumba Yangu</h2>
				<p style="color:#555;font-size:15px">Your one-time login code is:</p>
				<div style="background:#f4f4f4;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
					<span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a">%s</span>
				</div>
				<p style="color:#888;font-size:13px">This code expires in 10 minutes. Do not share it with anyone.</p>
			</div>
		`, code),
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("resend error %d: %v", resp.StatusCode, errResp)
	}

	return nil
}
