export default function() {
  let cookies = document.cookie.split(';');

  cookies.forEach((cookie) => {
    let cookieName = cookie.split('=')[0];

    document.cookie = `${cookieName}=; expires=${new Date(0).toUTCString()}`;
  });
}
