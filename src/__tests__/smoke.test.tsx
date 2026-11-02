
import { render, screen } from '@testing-library/react';

function MensagemTeste() {
  return <h1>Bem-vindo à Doce Momento</h1>;
}

describe('Teste inicial da aplicação', () => {
  it('deve exibir a mensagem de boas-vindas', () => {
    render(<MensagemTeste />);

    expect(
      screen.getByRole('heading', {
        name: 'Bem-vindo à Doce Momento',
      })
    ).toBeInTheDocument();
  });
});
