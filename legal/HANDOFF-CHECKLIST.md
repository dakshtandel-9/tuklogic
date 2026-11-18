# Handoff Checklist

- [x] Names, dates, addresses and governing law are filled in.
- [x] Final 50% payment received.
- [ ] Both sides sign `legal/IP-ASSIGNMENT-AGREEMENT.md` (a signed PDF or a photo of the signed page is enough). Keep one copy each.
- [ ] Keep the music and font source or license proof on file (`legal/THIRD-PARTY-NOTICES.md`).

## 1. GitHub (the code): the Assignee becomes the owner
1. ZockTech opens https://github.com/dakshtandel-9/tuklogic → **Settings** → scroll to **Danger Zone** → **Transfer ownership**.
2. Type the new owner: `tuklogictronexa`. Confirm by typing the repo name.
3. The Assignee gets an email from GitHub and must click **Accept transfer** within 1 day. Until she accepts, you are still the owner.
4. After she accepts, check that `tuklogictronexa/tuklogic` shows her as Owner. Then remove any leftover collaborator access for ZockTech in her repo settings (Settings → Collaborators), unless she wants it kept for maintenance.

## 2. Domain: stays with the Assignee
tuklogic.com remains in her GoDaddy account. ZockTech does nothing. Do not hold any login for it.

## 3. Hosting: ZockTech provides for 12 months
- Vercel and Cloudflare stay in ZockTech's accounts as a service. No ownership transfers with them.
- After the GitHub transfer, reconnect the Vercel project to the repo at its new location (Vercel → Project → Settings → Git). The Vercel GitHub app must be allowed on `tuklogictronexa`'s account. If it isn't, new commits will not deploy until it is.
- Before the 12 months end, hand the Vercel project and media storage to her accounts (or she hosts elsewhere).

## 4. Other items
- [ ] Google Tag Manager (GTM-NPRV3QT7): add her as Admin, then remove yourself if she wants.
- [ ] Rotate every key and password she will use. Send them through a password manager, never email or chat.
- [ ] She confirms she can open, clone and change the repo.
