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
  try {
    if (!wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen')
      document.addEventListener('visibilitychange', reAwake)
    }
  } catch (err) {
    console.error('')
  }
}

export async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release()
    document.removeEventListener('visibilitychange', reAwake)
    wakeLock = undefined
  }
}
