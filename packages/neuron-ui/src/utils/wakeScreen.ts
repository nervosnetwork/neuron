let wakeLock: WakeLockSentinel | undefined

async function reAwake() {
  if (document.visibilityState === 'visible') {
    wakeLock = await navigator.wakeLock.request('screen')
  } else {
    wakeLock?.release()
    wakeLock = undefined
  }
}

export async function wakeScreen() {
  if (wakeLock) return
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    document.addEventListener('visibilitychange', reAwake)
  } catch (err) {
    // do nothing here
  }
}

export async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release()
    document.removeEventListener('visibilitychange', reAwake)
    wakeLock = undefined
  }
}
