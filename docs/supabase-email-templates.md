# Supabase Auth Email Templates & Configuration Guide

## CRITICAL: Supabase Dashboard Configuration

Before the email templates work, you MUST update these settings in your Supabase Dashboard:

### 1. Site URL
Go to: **Authentication → URL Configuration → Site URL**

Set to: `https://ezvento.karthi-21.com`

### 2. Redirect URLs (Allowed List)
Go to: **Authentication → URL Configuration → Redirect URLs**

Add these URLs:
```
https://ezvento.karth-21.com/auth/callback
https://ezvento.karth-21.com/api/auth/callback-server
http://localhost:3003/auth/callback
http://localhost:3003/api/auth/callback-server
```

### 3. Email Templates
Go to: **Authentication → Email Templates**

For each template below, toggle "Custom SMTP" to use your own templates.

---

## Confirm Signup Email

Subject: `Confirm your Ezvento account`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background-color: #ffffff; border-radius: 12px; padding: 40px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo img { height: 48px; }
    h1 { color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    p { color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 8px 0; }
    .button:hover { background-color: #1d4ed8; }
    .fallback { color: #9ca3af; font-size: 14px; margin-top: 24px; }
    .fallback a { color: #2563eb; text-decoration: underline; }
    .footer { text-align: center; color: #9ca3af; font-size: 13px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <img src="https://ezvento.karth-21.com/logo.svg" alt="Ezvento" />
      </div>
      <h1>Welcome to Ezvento!</h1>
      <p>You're almost there. Click the button below to confirm your email address and start setting up your store.</p>
      <div style="text-align: center;">
        <a class="button" href="{{ .ConfirmationURL }}">Confirm your email</a>
      </div>
      <p class="fallback">If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Ezvento. All rights reserved.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
```

---

## Invite User Email

Subject: `You've been invited to join Ezvento`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background-color: #ffffff; border-radius: 12px; padding: 40px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo img { height: 48px; }
    h1 { color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    p { color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 8px 0; }
    .button:hover { background-color: #1d4ed8; }
    .fallback { color: #9ca3af; font-size: 14px; margin-top: 24px; }
    .fallback a { color: #2563eb; text-decoration: underline; }
    .footer { text-align: center; color: #9ca3af; font-size: 13px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <img src="https://ezvento.karth-21.com/logo.svg" alt="Ezvento" />
      </div>
      <h1>You've been invited!</h1>
      <p>You've been invited to join a store on Ezvento. Click the button below to accept the invitation and set up your account.</p>
      <div style="text-align: center;">
        <a class="button" href="{{ .ConfirmationURL }}">Accept invitation</a>
      </div>
      <p class="fallback">If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Ezvento. All rights reserved.</p>
      <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
```

---

## Magic Link Email (Phone OTP fallback / Magic Link login)

Subject: `Your Ezvento login link`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background-color: #ffffff; border-radius: 12px; padding: 40px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo img { height: 48px; }
    h1 { color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    p { color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 8px 0; }
    .button:hover { background-color: #1d4ed8; }
    .fallback { color: #9ca3af; font-size: 14px; margin-top: 24px; }
    .fallback a { color: #2563eb; text-decoration: underline; }
    .footer { text-align: center; color: #9ca3af; font-size: 13px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .warning { background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; margin-top: 24px; }
    .warning p { color: #92400e; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <img src="https://ezvento.karth-21.com/logo.svg" alt="Ezvento" />
      </div>
      <h1>Your login link</h1>
      <p>Click the button below to sign in to Ezvento. This link will expire in 24 hours.</p>
      <div style="text-align: center;">
        <a class="button" href="{{ .ConfirmationURL }}">Sign in to Ezvento</a>
      </div>
      <p class="fallback">If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
      <div class="warning">
        <p><strong>Security note:</strong> If you didn't request this login link, you can safely ignore this email. No one has accessed your account.</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 Ezvento. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

---

## Reset Password Email

Subject: `Reset your Ezvento password`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background-color: #ffffff; border-radius: 12px; padding: 40px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo img { height: 48px; }
    h1 { color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    p { color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 8px 0; }
    .button:hover { background-color: #1d4ed8; }
    .fallback { color: #9ca3af; font-size: 14px; margin-top: 24px; }
    .fallback a { color: #2563eb; text-decoration: underline; }
    .footer { text-align: center; color: #9ca3af; font-size: 13px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .warning { background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; margin-top: 24px; }
    .warning p { color: #92400e; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <img src="https://ezvento.karth-21.com/logo.svg" alt="Ezvento" />
      </div>
      <h1>Reset your password</h1>
      <p>We received a request to reset the password for your Ezvento account. Click the button below to set a new password.</p>
      <div style="text-align: center;">
        <a class="button" href="{{ .ConfirmationURL }}">Reset password</a>
      </div>
      <p class="fallback">If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
      <div class="warning">
        <p><strong>If you didn't request a password reset,</strong> you can safely ignore this email. Your password will not be changed.</p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 Ezvento. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

---

## Change Email Address Email

Subject: `Confirm your new email for Ezvento`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background-color: #ffffff; border-radius: 12px; padding: 40px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo img { height: 48px; }
    h1 { color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
    p { color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 8px 0; }
    .button:hover { background-color: #1d4ed8; }
    .fallback { color: #9ca3af; font-size: 14px; margin-top: 24px; }
    .fallback a { color: #2563eb; text-decoration: underline; }
    .footer { text-align: center; color: #9ca3af; font-size: 13px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <img src="https://ezvento.karth-21.com/logo.svg" alt="Ezvento" />
      </div>
      <h1>Confirm your email change</h1>
      <p>You've requested to change the email address on your Ezvento account. Click below to confirm this change.</p>
      <div style="text-align: center;">
        <a class="button" href="{{ .ConfirmationURL }}">Confirm email change</a>
      </div>
      <p class="fallback">If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Ezvento. All rights reserved.</p>
      <p>If you didn't request this change, please contact support immediately.</p>
    </div>
  </div>
</body>
</html>
```

---

## How to Apply These Templates

1. Go to your Supabase Dashboard → **Authentication → Email Templates**
2. Select each template type (Confirm signup, Invite user, Magic link, Reset password, Change email address)
3. Toggle on **Custom email template**
4. Paste the corresponding HTML from above
5. Set the **Subject** line as specified
6. Click **Save**

## Important: redirect_to URL

In each template, `{{ .ConfirmationURL }}` is handled by Supabase automatically. It generates a URL like:

```
https://acspgntsgvjamywujzhb.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=https://ezvento.karth-21.com/auth/callback
```

The `redirect_to` part comes from:
1. The `emailRedirectTo` parameter in your `signUp()` call (code-level)
2. The **Site URL** setting in Supabase Dashboard (fallback if not specified in code)

**Make sure** your Supabase Dashboard **Site URL** is set to `https://ezvento.karth-21.com` and the redirect URLs include `https://ezvento.karth-21.com/auth/callback`.