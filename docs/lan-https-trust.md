# LAN HTTPS Trust Troubleshooting

This is a dev-only troubleshooting note for the local LAN HTTPS workflow used by:

- `npm run dev:lan`

It is only about trusting the local Caddy certificate for testing media APIs on
other devices in your local network. It is not production certificate guidance.

## What this is solving

The LAN workflow uses Caddy with `tls internal`, which means Caddy generates and
signs a local development certificate with its own local CA.

If the client device does not trust that CA, the browser may:

- show a privacy / certificate warning
- refuse to open the secure URL cleanly
- expose an insecure context
- hide `navigator.mediaDevices`
- block camera/microphone APIs even though the app itself is fine

## Windows trust notes

Typical symptom:

- Chrome opens the LAN URL, but shows `Your connection is not private`

Practical dev fix:

1. Find the Caddy local root CA on the machine running Caddy.
2. Import that CA certificate into the Windows trusted root certificate store on
   the client machine.
3. Re-open Chrome after trust is applied.

If Chrome still shows a privacy warning after import:

- confirm you imported the CA as a trusted root, not just as a personal cert
- confirm you are opening the exact LAN host configured in `.env.landev`
- confirm the certificate chain now shows Caddy's local CA as trusted

## iPhone / iPad trust notes

Typical symptoms:

- Chrome on iPhone works after trust setup
- Safari on iPhone refuses to open the LAN URL or behaves more strictly

Practical dev fix:

1. Get the Caddy local root CA onto the iPhone/iPad.
2. Install the profile/certificate on the device.
3. Go to the iOS certificate trust settings and explicitly enable full trust for
   that root certificate.
4. Re-open the LAN URL after trust is enabled.

Important:

- on iOS, installing the certificate is often not enough by itself
- the certificate may need explicit full-trust enablement in system settings

## Browser notes

### Chrome on desktop

- Usually the easiest browser to validate once the local CA is trusted.
- If you still see a privacy warning, treat it as a cert trust issue first, not
  a LiveKit issue.

### Chrome on iPhone

- Uses the iOS networking/security stack underneath.
- If camera/mic works there, that is a strong sign the app and LiveKit path are
  fundamentally okay.
- If trust is set up correctly, Chrome on iPhone can be a good quick smoke test.

### Safari on iPhone

- Often stricter and less forgiving about local certificates / trust state.
- If Safari does not open the LAN URL at all, that still points first to local
  trust/certificate setup rather than app logic.
- Treat Safari failure as a secure-origin/trust problem until proven otherwise.

## Verification checklist

Open the LAN app URL from the client device:

```text
https://<LAN_HOST>:3443
```

Verify all of these:

1. The secure URL opens successfully.
2. The browser no longer shows a privacy warning.
3. In DevTools:

```js
window.isSecureContext === true
```

4. And:

```js
!!navigator.mediaDevices === true
```

If those checks pass, the device/browser is in the right trust state for LAN
media testing.

## Known caveats

- This workflow depends on local certificate trust on each test device.
- Different browsers on the same device may behave differently.
- Safari on iPhone may still be the strictest client.
- These issues are local dev trust/setup friction, not necessarily a core app or
  LiveKit integration bug.
