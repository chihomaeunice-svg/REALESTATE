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
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

func (c *Client) send(to, subject, html string) error {
	body := sendRequest{
		From:    c.From,
		To:      []string{to},
		Subject: subject,
		HTML:    html,
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

func (c *Client) SendOTP(to, code string) error {
	return c.send(to,
		"Your Nyumba Yangu login code: "+code,
		fmt.Sprintf(`
			<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
				<h2 style="color:#1a1a1a;margin-bottom:8px">Nyumba Yangu</h2>
				<p style="color:#555;font-size:15px">Your one-time login code is:</p>
				<div style="background:#f4f4f4;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
					<span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a">%s</span>
				</div>
				<p style="color:#888;font-size:13px">This code expires in 10 minutes. Do not share it with anyone.</p>
			</div>
		`, code),
	)
}

func (c *Client) SendPasswordReset(to, code string) error {
	return c.send(to,
		"Reset your Nyumba Yangu password",
		fmt.Sprintf(`
			<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
				<h2 style="color:#1a1a1a;margin-bottom:8px">Nyumba Yangu</h2>
				<p style="color:#555;font-size:15px">You requested a password reset. Use this code to set a new password:</p>
				<div style="background:#f4f4f4;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
					<span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a">%s</span>
				</div>
				<p style="color:#888;font-size:13px">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
			</div>
		`, code),
	)
}

func (c *Client) SendSubscriptionReminder(to, name string, day int, tier string, price float64) error {
	urgency := "reminder"
	if day >= 4 {
		urgency = "urgent"
	}

	subject := fmt.Sprintf("Nyumba Yangu: subscription %s (day %d of 5)", urgency, day)

	html := fmt.Sprintf(`
		<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
			<h2 style="color:#1a1a1a;margin-bottom:8px">Nyumba Yangu</h2>
			<p style="color:#555;font-size:15px">Hi %s,</p>
			<p style="color:#555;font-size:15px">Your <strong>%s</strong> subscription has expired. You are on day <strong>%d of 5</strong> of your grace period.</p>
			<div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #ef4444">
				<p style="color:#b91c1c;font-size:14px;margin:0">After the grace period, you will not be able to create properties, leases, or log payments, and your listings will be hidden from the marketplace.</p>
			</div>
			<p style="color:#555;font-size:15px">Pay <strong>TZS %s</strong> now to keep your management suite active.</p>
			<p style="color:#888;font-size:13px">Log in to your dashboard to make a payment via M-Pesa or Airtel Money.</p>
		</div>
	`, name, tier, day, fmtAmount(price))

	return c.send(to, subject, html)
}

func (c *Client) SendSubscriptionActivated(to, name, tier, periodEnd string) error {
	html := fmt.Sprintf(`
		<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
			<h2 style="color:#1a1a1a;margin-bottom:8px">Nyumba Yangu</h2>
			<p style="color:#555;font-size:15px">Hi %s,</p>
			<p style="color:#555;font-size:15px">Your payment has been received. Your <strong>%s</strong> subscription is now active.</p>
			<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #22c55e">
				<p style="color:#166534;font-size:14px;margin:0">Your current billing period runs until <strong>%s</strong>.</p>
			</div>
			<p style="color:#888;font-size:13px">Thank you for using Nyumba Yangu!</p>
		</div>
	`, name, tier, periodEnd)

	return c.send(to, "Nyumba Yangu: subscription activated", html)
}

func fmtAmount(amount float64) string {
	whole := int(amount)
	s := fmt.Sprintf("%d", whole)
	result := ""
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			result += ","
		}
		result += string(c)
	}
	return result
}
