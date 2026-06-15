# Correções Realizadas - VALORES Y SELECIONADOS

## Problema Identificado

Os botões de **VALORES Y SELECIONADOS** (Atual + Vizinhos, 1-5, 6-12, 13-18) não estavam marcando corretamente na racetrack e no mapa da mesa expandido. Além disso, os valores Y não passavam para as janelas expandidas.

### Causas Raiz

1. **Falta de Sincronização em Deslocamento**: A página `/deslocamento` mantinha `selectedX` e `selectedY` apenas localmente, sem comunicar com o BroadcastChannel `roulette_selections`. Isso significava que alterações feitas no painel de movimento não eram propagadas para a janela principal nem para as janelas expandidas.

2. **Problema de Timing em Popup**: As páginas de popup (`/mapa` e `/racetrack`) enviavam a mensagem `REQUEST_SELECTIONS` **antes** de configurar o listener `onmessage`. Isso criava uma race condition onde a resposta da janela principal chegava antes do listener estar pronto.

3. **Falta de Suporte a UPDATE_X_Y**: A janela principal (`app/page.tsx`) não tratava mensagens `UPDATE_X_Y` vindas da página de deslocamento.

## Correções Aplicadas

### 1. **app/deslocamento/page.tsx** ✅
- Adicionado novo `useEffect` para sincronizar `selectedX` e `selectedY` com o BroadcastChannel
- Implementado listener que recebe `UPDATE_SELECTIONS` da janela principal
- Adicionada lógica nos handlers `handleXChange` e `handleYChange` para enviar `UPDATE_X_Y` para a janela principal
- Agora as alterações no painel de movimento são propagadas em tempo real

**Mudanças:**
```typescript
// Novo useEffect para sincronização
useEffect(() => {
  const bcSelections = new BroadcastChannel("roulette_selections");
  
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === "UPDATE_SELECTIONS") {
      setSelectedX(event.data.selectedX || []);
      setSelectedY(event.data.selectedY || null);
    }
  };
  
  bcSelections.onmessage = handleMessage;
  bcSelections.postMessage({ type: "REQUEST_SELECTIONS" });
  
  return () => bcSelections.close();
}, []);

// Handlers atualizados
const handleXChange = (newX: number[]) => {
  setSelectedX(newX);
  const bcSelections = new BroadcastChannel("roulette_selections");
  bcSelections.postMessage({ type: "UPDATE_X_Y", selectedX: newX, selectedY });
  bcSelections.close();
};

const handleYChange = (newY: string | null) => {
  setSelectedY(newY);
  const bcSelections = new BroadcastChannel("roulette_selections");
  bcSelections.postMessage({ type: "UPDATE_X_Y", selectedX, selectedY: newY });
  bcSelections.close();
};
```

### 2. **app/app/page.tsx** ✅
- Adicionado tratamento para mensagens `UPDATE_X_Y` no listener do BroadcastChannel
- Agora a janela principal recebe e processa atualizações vindas da página de deslocamento

**Mudanças:**
```typescript
} else if (event.data.type === 'UPDATE_X_Y') {
  if (event.data.selectedX !== undefined) {
    setSelectedX(event.data.selectedX);
  }
  if (event.data.selectedY !== undefined) {
    setSelectedY(event.data.selectedY);
  }
}
```

### 3. **app/mapa/page.tsx** ✅
- Reordenado o código para configurar o listener **antes** de enviar `REQUEST_SELECTIONS`
- Adicionado suporte para mensagens `UPDATE_X_Y`
- Melhorado o tratamento de valores padrão (null/undefined)

**Mudanças:**
```typescript
// Sincronizar seleções com melhor timing
const bcSelections = new BroadcastChannel("roulette_selections");

const handleMessage = (event) => {
  if (event.data.type === "UPDATE_SELECTIONS") {
    setSel(event.data.sel);
    setSelectedX(event.data.selectedX || []);
    setSelectedY(event.data.selectedY || null);
  } else if (event.data.type === "UPDATE_X_Y") {
    if (event.data.selectedX !== undefined) {
      setSelectedX(event.data.selectedX);
    }
    if (event.data.selectedY !== undefined) {
      setSelectedY(event.data.selectedY);
    }
  }
};

bcSelections.onmessage = handleMessage;

// Pedir sincronização inicial APÓS configurar o listener
bcSelections.postMessage({ type: 'REQUEST_SELECTIONS' });
```

### 4. **app/racetrack/page.tsx** ✅
- Mesmas correções aplicadas ao arquivo `/mapa`
- Agora o racetrack expandido também recebe corretamente os valores Y

## Fluxo de Sincronização Agora

```
Janela Principal (app/page.tsx)
    ↓ BroadcastChannel 'roulette_selections'
    ├→ Envia UPDATE_SELECTIONS com sel, selectedX, selectedY
    ├← Recebe UPDATE_X_Y da página de deslocamento
    └← Recebe UPDATE_HIGHLIGHTS do FIFA COPA

Página Deslocamento (deslocamento/page.tsx)
    ↓ BroadcastChannel 'roulette_selections'
    ├← Recebe UPDATE_SELECTIONS da janela principal
    └→ Envia UPDATE_X_Y quando usuário clica em X ou Y

Página Mapa (mapa/page.tsx)
    ↓ BroadcastChannel 'roulette_selections'
    ├← Recebe UPDATE_SELECTIONS da janela principal
    └← Recebe UPDATE_X_Y quando deslocamento muda

Página Racetrack (racetrack/page.tsx)
    ↓ BroadcastChannel 'roulette_selections'
    ├← Recebe UPDATE_SELECTIONS da janela principal
    └← Recebe UPDATE_X_Y quando deslocamento muda
```

## Testes Recomendados

1. **Teste de Sincronização X:**
   - Clique em um botão X na página de deslocamento
   - Verifique se o número é marcado no mapa e racetrack expandido
   - Verifique se a cor é consistente em todas as janelas

2. **Teste de Sincronização Y:**
   - Clique em um botão Y (ex: "1 a 5 AMARELO") na página de deslocamento
   - Verifique se os números correspondentes são marcados no mapa e racetrack
   - Teste "ATUAL + VIZINHOS" para verificar a lógica de vizinhos

3. **Teste de Timing:**
   - Abra o mapa expandido ANTES de clicar em X ou Y
   - Abra o racetrack expandido ANTES de clicar em X ou Y
   - Verifique se os valores aparecem imediatamente

4. **Teste de Múltiplas Janelas:**
   - Abra múltiplas janelas expandidas simultaneamente
   - Faça alterações no painel de movimento
   - Verifique se todas as janelas recebem as atualizações

## Notas Técnicas

- As correções mantêm a compatibilidade com o código existente
- O BroadcastChannel é criado e fechado corretamente para evitar memory leaks
- Os valores padrão (null/undefined) são tratados para evitar erros
- A ordem de configuração do listener antes da requisição resolve a race condition

## Arquivos Modificados

1. `/app/deslocamento/page.tsx` - Adicionada sincronização completa
2. `/app/app/page.tsx` - Adicionado tratamento de UPDATE_X_Y
3. `/app/mapa/page.tsx` - Corrigido timing e adicionado UPDATE_X_Y
4. `/app/racetrack/page.tsx` - Corrigido timing e adicionado UPDATE_X_Y
