// Logos the clients page shows for each client (the same map as CL in public/assets/clients-cuhJ7aY5.js).
const CLIENT_LOGOS: Record<string, string> = {
  "Optum": "/client-logos/optum.svg",
  "U.S. Bank": "/client-logos/us-bank.svg",
  "Intact": "/client-logos/intact.svg",
  "Freddie Mac": "/client-logos/freddie-mac.svg",
  "Sysco": "/client-logos/sysco.svg",
  "Floor & Decor": "/client-logos/floor-decor.svg",
  "CGI": "/client-logos/cgi.svg",
  "AT&T": "/client-logos/att.svg",
  "Brightspeed": "/client-logos/brightspeed.png",
  "EPAM": "/client-logos/epam.png",
  "DXC Technology": "/client-logos/dxc.svg",
  "Fujitsu": "/client-logos/fujitsu.svg",
  "Tata Consultancy Services (TCS)": "/client-logos/tcs.svg",
  "EY": "/client-logos/ey.svg",
  "Centene": "/client-logos/centene.svg"
};

const unescape = (value: string) => value.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * The captured clients page lists client names as text, while the app renders a logo and the name.
 * Render the same markup on the server, or hydration fails (React error #418) and the page is
 * rebuilt in the browser on every visit.
 */
export function withClientLogos(html: string): string {
  return html.replace(
    /<div class="flex items-center justify-center border border-white\/20 bg-\[#FFFFFF05\] p-4" style="min-height:140px;text-align:center">([^<]*)<\/div>/g,
    (cell, text: string) => {
      const name = unescape(text);
      const logo = CLIENT_LOGOS[name];
      if (!logo) return cell;
      return `<div class="flex flex-col items-center justify-center border border-white/20 p-4" style="min-height:140px;text-align:center;background:#fff"><img src="${logo}" alt="${escape(name)}" loading="lazy" style="max-width:80%;max-height:64px;object-fit:contain"/><span style="margin-top:0.75rem;font-size:0.75rem;color:#4b5563">${text}</span></div>`;
    },
  );
}
