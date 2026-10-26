/** Browser location, asked for only when a session needs it. */

const GEO_TIMEOUT_MS = 15_000

/** Resolves to `{ latitude, longitude }`, or rejects with a message for the user. */
export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser cannot share its location.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => reject(new Error('Location was not shared. Allow location access and try again.')),
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS },
    )
  })
}
