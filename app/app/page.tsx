  // Sincronizar TODAS as marcações com janelas expandidas
  useEffect(() => {
    const bc = new BroadcastChannel('roulette_selections');
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'REQUEST_SELECTIONS') {
        bc.postMessage({ 
          type: 'UPDATE_SELECTIONS', 
          sel, 
          selectedX, 
          selectedY,
          selMode,
          markingMode 
        });
      } else if (event.data.type === 'UPDATE_HIGHLIGHTS') {
        setHighlightedNumbers(event.data.isActive ? event.data.numbers : []);
      } else if (event.data.type === 'UPDATE_X_Y') {
        if (event.data.selectedX !== undefined) {
          setSelectedX(event.data.selectedX);
        }
        if (event.data.selectedY !== undefined) {
          setSelectedY(event.data.selectedY);
        }
      } else if (event.data.type === 'RACETRACK_CLICK' || event.data.type === 'MAPA_CLICK') {
        // Processar cliques vindos das páginas expandidas
        const n = event.data.number;
        if (n !== undefined) {
          setSel((prev) => applyClick(prev, n, selMode, markingMode));
        }
      }
    };
    
    bc.onmessage = handleMessage;
    
    bc.postMessage({ 
      type: 'UPDATE_SELECTIONS', 
      sel, 
      selectedX, 
      selectedY,
      selMode,
      markingMode 
    });
    return () => bc.close();
  }, [sel, selectedX, selectedY, selMode, markingMode]);
