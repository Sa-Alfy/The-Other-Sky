import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, test } from 'vitest'
import App from './App'
import { Constellations } from './pages/Constellations'
import { MorningSky } from './pages/MorningSky'
import { PersonalSky } from './pages/PersonalSky'

beforeEach(() => {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = input.toString()
    if (url.includes('/api/me/sky')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: { ownWishes: [], savedWishes: [], lightedWishes: [] },
          }),
          { status: 200 }
        )
      )
    }
    if (url.includes('/api/morning-sky')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [],
          }),
          { status: 200 }
        )
      )
    }
    if (url.includes('/api/constellations')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            success: true,
            data: [
              { id: 'hope', name: 'Hope', slug: 'hope', description: 'Beacons reaching forward.', wishCount: 12 },
              { id: 'peace', name: 'Peace', slug: 'peace', description: 'Calm waters in the dark.', wishCount: 8 },
            ],
          }),
          { status: 200 }
        )
      )
    }
    return Promise.resolve(
      new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
    )
  }) as typeof fetch
})

test('landing screen invites the user to enter the sky', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByRole('button', { name: 'Enter the Sky' })).toBeInTheDocument()
})

test('galaxy view shows navigation bar with new Milestone 5 links', async () => {
  render(
    <MemoryRouter initialEntries={['/sky']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByRole('link', { name: 'Constellations' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Morning Sky' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Personal Sky' })).toBeInTheDocument()
})

test('personal sky renders tabs for own, saved, and lighted wishes', async () => {
  render(
    <MemoryRouter>
      <PersonalSky />
    </MemoryRouter>
  )
  expect(await screen.findByRole('heading', { name: 'Personal Sky' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /My Wishes/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /Saved Wishes/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /Light Sent/i })).toBeInTheDocument()
})

test('morning sky renders poetic heading and empty state', async () => {
  render(
    <MemoryRouter>
      <MorningSky />
    </MemoryRouter>
  )
  expect(await screen.findByRole('heading', { name: 'It happened.' })).toBeInTheDocument()
  expect(screen.getByText(/The morning sky is still quiet/i)).toBeInTheDocument()
})

test('constellations page renders constellations grid and chips', async () => {
  render(
    <MemoryRouter>
      <Constellations />
    </MemoryRouter>
  )
  expect(await screen.findByRole('heading', { name: 'Constellations' })).toBeInTheDocument()
  expect(await screen.findByText('Hope')).toBeInTheDocument()
  expect(await screen.findByText('Peace')).toBeInTheDocument()
})

test('closing a deep-linked wish card closes the card without re-opening', async () => {
  const sampleWish = {
    id: 'test-wish-1',
    text: 'I wish for starlight',
    category: 'hope',
    status: 'approved',
    visibility: 'public',
    createdAt: '2026-09-01T00:00:00Z',
    reactions: 5,
    x: 0.5,
    y: 0.5,
    z: 0,
    size: 1.5,
    brightness: 1,
    hue: 45,
  }

  const prevFetch = globalThis.fetch
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(JSON.stringify({ success: true, data: [sampleWish] }), { status: 200 })
    )) as typeof fetch

  render(
    <MemoryRouter initialEntries={['/sky?wishId=test-wish-1']}>
      <App />
    </MemoryRouter>
  )

  expect(await screen.findByText('“I wish for starlight”')).toBeInTheDocument()

  const closeButton = screen.getByRole('button', { name: 'Back to the sky' })
  closeButton.click()

  expect(await screen.findByText('Select a star in the sky.')).toBeInTheDocument()
  expect(screen.queryByText('“I wish for starlight”')).not.toBeInTheDocument()

  globalThis.fetch = prevFetch
})