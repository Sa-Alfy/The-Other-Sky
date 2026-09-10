import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersonalSky } from './PersonalSky'

// Minimal sky data for tests
const makeSkyData = (override: Partial<{
  ownWishes: unknown[],
  savedWishes: unknown[],
  lightedWishes: unknown[],
  hasRecoveryPhrase: boolean,
}> = {}) => ({
  ownWishes: [],
  savedWishes: [],
  lightedWishes: [],
  hasRecoveryPhrase: false,
  ...override,
})

function renderPage() {
  return render(
    <MemoryRouter>
      <PersonalSky />
    </MemoryRouter>
  )
}

describe('PersonalSky recovery UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows "Protect this sky" button when hasRecoveryPhrase is false', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: makeSkyData() }),
    } as Response)

    renderPage()
    expect(await screen.findByRole('button', { name: /protect this sky/i })).toBeInTheDocument()
    expect(screen.queryByText(/sky protected/i)).not.toBeInTheDocument()
  })

  it('shows "Sky Protected" badge when hasRecoveryPhrase is true', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: makeSkyData({ hasRecoveryPhrase: true }) }),
    } as Response)

    renderPage()
    expect(await screen.findByText(/sky protected/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /protect this sky/i })).not.toBeInTheDocument()
  })

  it('clicking "Protect this sky" opens phrase modal with the phrase', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch')
    // Initial sky load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: makeSkyData() }),
    } as Response)
    // Generate phrase
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: { phrase: 'dawn-river-stone-light' } }),
    } as Response)

    renderPage()
    const protectBtn = await screen.findByRole('button', { name: /protect this sky/i })
    fireEvent.click(protectBtn)

    expect(await screen.findByText('dawn-river-stone-light')).toBeInTheDocument()
    expect(screen.getByText(/this is the only time you'll see this/i)).toBeInTheDocument()
  })

  it('"Done" button is disabled until the confirmation checkbox is checked', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: makeSkyData() }),
    } as Response)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: { phrase: 'dawn-river-stone-light' } }),
    } as Response)

    renderPage()
    const protectBtn = await screen.findByRole('button', { name: /protect this sky/i })
    fireEvent.click(protectBtn)

    const doneBtn = await screen.findByRole('button', { name: /done/i })
    expect(doneBtn).toBeDisabled()

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(doneBtn).not.toBeDisabled()
  })

  it('shows "Already have a sky? Recover it" entry point', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: makeSkyData() }),
    } as Response)

    renderPage()
    await screen.findByRole('button', { name: /protect this sky/i })
    // Recover link should appear
    expect(screen.getByRole('button', { name: /already have a sky\? recover it/i })).toBeInTheDocument()
  })

  it('opening "Recover it" shows the recover modal', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: makeSkyData() }),
    } as Response)

    renderPage()
    await screen.findByRole('button', { name: /protect this sky/i })
    const recoverLink = screen.getByRole('button', { name: /already have a sky\? recover it/i })
    fireEvent.click(recoverLink)

    expect(await screen.findByRole('dialog', { name: /recover your sky/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('word-word-word-word')).toBeInTheDocument()
  })

  it('recover dialog shows error on 401 without modifying the message', async () => {
    const mockFetch = vi.spyOn(globalThis, 'fetch')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: makeSkyData() }),
    } as Response)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid recovery phrase.' },
      }),
    } as Response)

    renderPage()
    await screen.findByRole('button', { name: /protect this sky/i })
    fireEvent.click(screen.getByRole('button', { name: /already have a sky\? recover it/i }))

    const input = await screen.findByPlaceholderText('word-word-word-word')
    fireEvent.change(input, { target: { value: 'wrong-wrong-wrong-wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /recover sky/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid recovery phrase.')).toBeInTheDocument()
    })
  })
})
