# Handoff Checklist

Do the steps in order. Tick each box.

## Before handover
- [x] Names, dates, addresses and governing law are filled in (`LICENSE`, `legal/IP-ASSIGNMENT-AGREEMENT.md`).
- [ ] Keep the music and font source or license proof on file (`legal/THIRD-PARTY-NOTICES.md`).
- [ ] Have a lawyer review the agreement, then both sides sign and keep a copy.
- [ ] Client pays the final 50%. Handover is within 7 days of signing.

## Transfers (each one needs the client's account details)
1. **GitHub:** repo `dakshtandel-9/tuklogic` → Settings → Danger Zone → Transfer ownership → `tuklogictronexa`. Client accepts the email invite.
2. **Vercel:** project on the zocktech06-7535 account → Settings → Transfer Project → client's team. Re-check the tuklogic.com domain and environment variables after.
3. **Domain (tuklogic.com):** at the registrar, start an account-to-account push or a transfer, so the client holds the domain login.
4. **Cloudflare R2 (media storage):** the client creates their own bucket, you copy the files across, and the client's account then holds the bucket. Update the media settings to the new bucket.
5. **Google Tag Manager (GTM-NPRV3QT7):** add the client as Admin on the container, then remove yourself.
6. **Third-party tool accounts** (Kling, Higgsfield): hand over the generated files. Generated media doesn't need account transfer.

## Credentials
- [ ] Rotate every key, token and password the client will use. Send new ones through a password manager, never by email or chat.
- [ ] Remove yourself from all accounts after the client confirms access.

## After handover
- [ ] Client confirms the site builds and deploys from their own accounts.
- [ ] Both sides keep the signed agreement and the transfer confirmation emails.
