# Documentação: Histórico Quente

## Visão Geral

A nova funcionalidade **Histórico Quente** foi implementada para fornecer análise estatística avançada do histórico de números da roleta. Este recurso está integrado ao painel principal da aplicação e oferece três abas independentes de análise.

## Arquivos Adicionados

### 1. `/app/app/lib/hothistory.ts`
Biblioteca central com toda a lógica de análise estatística:

#### Funções Principais:

**`analyzeTerminalPatterns(history, patternLength, minRepetitions)`**
- Analisa sequências de números anteriores que chamam terminais específicos
- Retorna padrões encontrados com força percentual e estatísticas de terminais
- Parâmetros:
  - `history`: Array de números do histórico
  - `patternLength`: Quantos números anteriores usar como padrão (1, 2 ou 3)
  - `minRepetitions`: Número mínimo de repetições para considerar um padrão

**`analyzeStrategy(history, strategy)`**
- Analisa intersecções de estratégias simples (cor, par/ímpar, alto/baixo, dúzia, coluna)
- Calcula percentuais e "temperatura" da seleção
- Retorna números encontrados na intersecção e suas ocorrências

**`analyzeSectorPatterns(history, patternLength, minRepetitions)`**
- Analisa sequências que chamam setores específicos da roda (Voisins, Tier, Orphelins, Zero Game)
- Funciona similar à análise de terminais, mas para setores físicos da roleta

#### Constantes:

- `TERMINAL_NUMBERS`: Mapeamento de terminal para seus números
- `SECTORS`: Definição dos setores da roda europeia

### 2. `/app/app/components/HotHistoryAnalysis.tsx`
Componente React que renderiza a interface das três abas:

#### Aba 1: Terminais + Padrão
- Seletor para escolher quantos números anteriores usar como padrão (1, 2, 3)
- Campo para número mínimo de repetições
- Exibe padrões encontrados com:
  - Sequência anterior
  - Terminal chamado
  - Percentual de força
  - Quantidade de repetições
- Botão "Marcar Terminal X" para marcar todos os números do terminal
- Tabela com percentual geral de cada terminal (0-9)

#### Aba 2: Estratégias Simples
- Seletores para marcar/desmarcar estratégias:
  - Cor (Vermelho/Preto)
  - Par/Ímpar
  - Alto/Baixo (1-18 / 19-36)
  - Dúzia (1ª/2ª/3ª)
  - Coluna (C1/C2/C3)
- Exibe resultado da intersecção:
  - Números encontrados
  - Ocorrências no histórico
  - Percentual da intersecção
  - Temperatura (cold/warm/hot/very_hot)
- Botão "Marcar Seleção" para marcar apenas os números da intersecção

#### Aba 3: Roda Quente
- Seletor para escolher quantos números anteriores usar como padrão (1-6)
- Campo para número mínimo de repetições
- Exibe padrões encontrados com:
  - Sequência anterior
  - Setor chamado (VOISINS/TIER/ORPHELINS/ZERO_GAME)
  - Percentual de força
  - Quantidade de repetições
- Botão "Marcar [Setor]" para marcar todos os números do setor
- Tabela com percentual geral de cada setor

## Integração

O componente `HotHistoryAnalysis` foi adicionado ao painel principal (`/app/app/page.tsx`) na seção de estratégias, logo abaixo da análise FIFA COPA.

### Props:
```typescript
{
  history: number[];           // Array do histórico de números
  onMarkNumbers: (nums: number[]) => void;  // Callback para marcar números
  onColorChange: (index: number) => void;   // Callback para mudar cor ativa
}
```

## Fluxo de Uso

1. **Abrir Histórico Quente**: O componente está sempre visível no painel principal
2. **Selecionar Aba**: Clicar em um dos três botões de aba
3. **Configurar Parâmetros**: Ajustar seletor de padrão e mínimo de repetições
4. **Visualizar Resultados**: Os padrões/estratégias encontradas aparecem automaticamente
5. **Marcar Números**: Clicar no botão "Marcar" para colorir os números na roleta

## Detalhes Técnicos

### Cálculo de Temperatura (Aba 2)
- **Very Hot** (🔴): ≥ 40% de ocorrências
- **Hot** (🟠): ≥ 30% de ocorrências
- **Warm** (🟡): ≥ 20% de ocorrências
- **Cold** (🔵): < 20% de ocorrências

### Setores da Roda (Aba 3)
Os setores seguem a configuração europeia padrão:
- **Voisins**: 22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25
- **Tier**: 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33
- **Orphelins**: 1, 20, 14, 31, 9, 17
- **Zero Game**: 12, 35, 3, 26, 0, 32, 15 (subconjunto de Voisins)

### Terminais
Os 10 terminais (0-9) agrupam números que terminam no mesmo dígito:
- Terminal 0: 0, 10, 20, 30
- Terminal 1: 1, 11, 21, 31
- ... e assim por diante

## Performance

- Análise em tempo real conforme o histórico é atualizado
- Cálculos otimizados usando `useMemo` para evitar recálculos desnecessários
- Componente minimizável para economizar espaço na tela

## Compatibilidade

- Funciona com o sistema de cores existente da aplicação
- Integra-se com o sistema de marcação (`markMultiple`)
- Sincroniza com o histórico em tempo real via `BroadcastChannel`

## Próximas Melhorias Sugeridas

1. Exportar dados de análise em CSV
2. Gráficos visuais de tendências
3. Histórico de análises anteriores
4. Alertas automáticos quando padrões aparecem
5. Configurações personalizáveis de limites de temperatura
