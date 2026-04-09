import { describe, expect, it } from 'vitest'
import { sanitizeReleaseNotes } from 'utils/sanitizeReleaseNotes'

describe('sanitizeReleaseNotes', () => {
  it('removes interactive markup and keeps basic formatting', () => {
    const sanitized = sanitizeReleaseNotes(`
      <p>safe</p>
      <button data-method="open-in-window" onclick="window.electron.ipcRenderer.invoke('open-in-window')">open</button>
      <img src="x" onerror="alert('xss')" />
      <script>alert('xss')</script>
      <pre><code>const ok = true</code></pre>
    `)

    expect(sanitized).toContain('<p>safe</p>')
    expect(sanitized).toContain('<pre><code>const ok = true</code></pre>')
    expect(sanitized).not.toContain('<button')
    expect(sanitized).not.toContain('<img')
    expect(sanitized).not.toContain('<script')
    expect(sanitized).not.toContain('onclick')
    expect(sanitized).not.toContain('data-method')
    expect(sanitized).not.toContain('onerror')
    expect(sanitized).not.toContain("alert('xss')")
  })
})
