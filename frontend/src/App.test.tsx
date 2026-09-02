import { render, screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import App from './App'

beforeEach(() => {
  globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }))) as typeof fetch
})

test('landing screen invites the user to enter the sky', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'Enter the Sky' })).toBeInTheDocument()
})