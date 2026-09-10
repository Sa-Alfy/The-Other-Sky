import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GalaxyCanvas, type GalaxyCanvasRef, type Wish } from './GalaxyCanvas'

const sampleWishes: Wish[] = [
  {
    id: 'wish-1',
    text: 'May there be peace and kindness.',
    category: 'peace',
    status: 'approved',
    visibility: 'public',
    createdAt: new Date().toISOString(),
    reactions: 5,
    x: 0.3,
    y: 0.4,
    z: 0,
    size: 1.5,
    brightness: 0.9,
    hue: 45,
  },
  {
    id: 'wish-2',
    text: 'I hope tomorrow brings hope.',
    category: 'hope',
    status: 'approved',
    visibility: 'public',
    createdAt: new Date().toISOString(),
    reactions: 12,
    x: 0.7,
    y: 0.6,
    z: 0,
    size: 2.0,
    brightness: 1.1,
    hue: 210,
  },
]

describe('GalaxyCanvas component (smoke & interface tests)', () => {
  it('renders canvas element with accessible label and starfield class', () => {
    const onSelectWish = vi.fn()
    render(
      <GalaxyCanvas
        wishes={sampleWishes}
        selectedWish={null}
        onSelectWish={onSelectWish}
      />
    )

    const canvas = screen.getByLabelText('Galaxy of wishes canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass('starfield')
  })

  it('provides recenterOnWish method through ref handle', () => {
    const ref = createRef<GalaxyCanvasRef>()
    const onSelectWish = vi.fn()
    render(
      <GalaxyCanvas
        ref={ref}
        wishes={sampleWishes}
        selectedWish={null}
        onSelectWish={onSelectWish}
      />
    )

    expect(ref.current).toBeDefined()
    expect(typeof ref.current?.recenterOnWish).toBe('function')

    // Calling recenterOnWish with a valid wish does not throw
    expect(() => {
      ref.current?.recenterOnWish(sampleWishes[0], true)
    }).not.toThrow()
  })
})
