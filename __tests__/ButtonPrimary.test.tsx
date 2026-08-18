import ButtonPrimary from '@/components/Common/ButtonPrimary'
import { render, screen } from '@testing-library/react-native'
import React from 'react'

// Smoke test: prova que o setup de Jest/Expo funciona ponta a ponta
// (preset jest-expo, alias @/, mocks nativos do Expo, RTL).
describe('ButtonPrimary', () => {
  it('renderiza o título sem quebrar', async () => {
    await render(<ButtonPrimary title="Continuar" onPress={() => {}} />)

    expect(screen.getByText('Continuar')).toBeTruthy()
  })
})
