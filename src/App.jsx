import React, { useState, useEffect } from 'react';
import { Shuffle, Eye, ArrowLeftRight, Users } from 'lucide-react';

const CaboGame = () => {
  const [deck, setDeck] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [aiHand, setAIHand] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('player');
  const [drawnCard, setDrawnCard] = useState(null);
  const [gamePhase, setGamePhase] = useState('setup');
  const [caboCalledBy, setCaboCalledBy] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAIScore] = useState(0);
  const [message, setMessage] = useState('');
  const [revealedCards, setRevealedCards] = useState({ player: new Set(), ai: new Set() });
  const [actionMode, setActionMode] = useState(null);
  const [actionStep, setActionStep] = useState(0);
  const [selectedCards, setSelectedCards] = useState({ player: null, ai: null });
  const [tempRevealed, setTempRevealed] = useState(null);

  const getActionType = (value) => {
    if (value === 7 || value === 8) return 'peek';
    if (value === 9 || value === 10) return 'spy';
    if (value === 11 || value === 12) return 'swap';
    if (value === 13) return 'spyswap';
    return null;
  };

  const initGame = () => {
    const newDeck = [];
    for (let i = 0; i <= 13; i++) {
      const copies = (i === 0 || i === 13) ? 2 : 4;
      for (let j = 0; j < copies; j++) {
        newDeck.push({ value: i, id: `${i}-${j}-${Math.random()}` });
      }
    }
    const shuffled = [...newDeck].sort(() => Math.random() - 0.5);
    const pHand = shuffled.slice(0, 4);
    const aHand = shuffled.slice(4, 8);
    const remainingDeck = shuffled.slice(8);
    const firstDiscard = remainingDeck.pop();
    
    setPlayerHand(pHand);
    setAIHand(aHand);
    setDeck(remainingDeck);
    setDiscardPile([firstDiscard]);
    setCurrentPlayer('player');
    setGamePhase('setup');
    setCaboCalledBy(null);
    setDrawnCard(null);
    setActionMode(null);
    setActionStep(0);
    setSelectedCards({ player: null, ai: null });
    setTempRevealed(null);
    setRevealedCards({ player: new Set(), ai: new Set() });
    setMessage('👆 Click on 2 of YOUR cards to look at them!');
  };

  useEffect(() => {
    initGame();
  }, []);

  const calculateHandValue = (hand) => {
    return hand.reduce((sum, card) => sum + card.value, 0);
  };

  const revealSetupCard = (idx) => {
    if (gamePhase !== 'setup' || revealedCards.player.has(idx)) return;
    const newRevealed = new Set(revealedCards.player);
    newRevealed.add(idx);
    setRevealedCards({ ...revealedCards, player: newRevealed });
    if (newRevealed.size === 2) {
      setTimeout(() => {
        setGamePhase('playing');
        setMessage('🎮 Your turn! Click DECK or DISCARD to draw a card');
      }, 800);
    } else {
      setMessage('✅ Good! Now click 1 more card to reveal');
    }
  };

  const drawFromDeck = () => {
    if (currentPlayer !== 'player' || drawnCard) return;
    if (gamePhase !== 'playing' && gamePhase !== 'finalRound') return;
    if (deck.length === 0) return;
    const card = { ...deck[deck.length - 1] };
    setDrawnCard(card);
    setDeck(deck.slice(0, -1));
    const action = getActionType(card.value);
    if (action) {
      setMessage(`🎴 Action Card! Use ${action.toUpperCase()} or keep as ${card.value} points?`);
    } else {
      setMessage('💡 Click one of YOUR cards to replace it, or click DISCARD');
    }
  };

  const drawFromDiscard = () => {
    if (currentPlayer !== 'player' || drawnCard) return;
    if (gamePhase !== 'playing' && gamePhase !== 'finalRound') return;
    if (discardPile.length === 0) return;
    const card = { ...discardPile[discardPile.length - 1] };
    setDrawnCard(card);
    setDiscardPile(discardPile.slice(0, -1));
    setMessage('💡 Click one of YOUR cards to replace it');
  };

  const discardDrawnCard = () => {
    if (!drawnCard) return;
    setDiscardPile([...discardPile, drawnCard]);
    setDrawnCard(null);
    setActionMode(null);
    endPlayerTurn();
  };

  const replaceCard = (idx) => {
    if (!drawnCard || actionMode) return;
    const oldCard = playerHand[idx];
    const newHand = [...playerHand];
    newHand[idx] = drawnCard;
    setPlayerHand(newHand);
    setDiscardPile([...discardPile, oldCard]);
    setDrawnCard(null);
    const newRevealed = new Set(revealedCards.player);
    newRevealed.delete(idx);
    setRevealedCards({ ...revealedCards, player: newRevealed });
    endPlayerTurn();
  };

  const useAction = () => {
    const action = getActionType(drawnCard.value);
    setActionMode(action);
    setActionStep(0);
    setSelectedCards({ player: null, ai: null });
    if (action === 'peek') setMessage('👁️ PEEK: Click one of YOUR cards to look at it');
    else if (action === 'spy') setMessage('🔍 SPY: Click one of AI\'s cards to look at it');
    else if (action === 'swap') setMessage('🔄 SWAP: First, click one of YOUR cards');
    else if (action === 'spyswap') setMessage('🎯 SPY SWAP: Click one of AI\'s cards to look at it first');
  };

  const handleActionCardSelect = (target, idx) => {
    if (!actionMode) return;
    if (actionMode === 'peek') {
      setTempRevealed({ target: 'player', idx });
      setMessage('✅ Peeked! Click CONTINUE');
    } else if (actionMode === 'spy' && target === 'ai') {
      setTempRevealed({ target: 'ai', idx });
      setMessage('✅ Spied! Click CONTINUE');
    } else if (actionMode === 'swap') {
      if (actionStep === 0 && target === 'player') {
        setSelectedCards({ ...selectedCards, player: idx });
        setActionStep(1);
        setMessage('🔄 Now click one of AI\'s cards to swap with');
      } else if (actionStep === 1 && target === 'ai') {
        const newPlayerHand = [...playerHand];
        const newAIHand = [...aiHand];
        const temp = newPlayerHand[selectedCards.player];
        newPlayerHand[selectedCards.player] = newAIHand[idx];
        newAIHand[idx] = temp;
        setPlayerHand(newPlayerHand);
        setAIHand(newAIHand);
        setDiscardPile([...discardPile, drawnCard]);
        setDrawnCard(null);
        setActionMode(null);
        setSelectedCards({ player: null, ai: null });
        setMessage('✅ Cards swapped!');
        setTimeout(() => endPlayerTurn(), 1000);
      }
    } else if (actionMode === 'spyswap') {
      if (actionStep === 0 && target === 'ai') {
        setTempRevealed({ target: 'ai', idx });
        setSelectedCards({ ...selectedCards, ai: idx });
        setActionStep(1);
        setMessage(`AI has ${aiHand[idx].value}. Now click YOUR card to swap`);
      } else if (actionStep === 1 && target === 'player') {
        const newPlayerHand = [...playerHand];
        const newAIHand = [...aiHand];
        const temp = newPlayerHand[idx];
        newPlayerHand[idx] = newAIHand[selectedCards.ai];
        newAIHand[selectedCards.ai] = temp;
        setPlayerHand(newPlayerHand);
        setAIHand(newAIHand);
        setDiscardPile([...discardPile, drawnCard]);
        setDrawnCard(null);
        setActionMode(null);
        setSelectedCards({ player: null, ai: null });
        setTempRevealed(null);
        setMessage('✅ Spy Swap complete!');
        setTimeout(() => endPlayerTurn(), 1000);
      }
    }
  };

  const continueAfterAction = () => {
    setDiscardPile([...discardPile, drawnCard]);
    setDrawnCard(null);
    setActionMode(null);
    setTempRevealed(null);
    endPlayerTurn();
  };

  const callCabo = () => {
    if (drawnCard || actionMode || gamePhase !== 'playing') return;
    setCaboCalledBy('player');
    setGamePhase('finalRound');
    setMessage('🎯 CABO! AI gets one final turn...');
    setCurrentPlayer('ai');
    setTimeout(() => aiTurn(true), 1500);
  };

  const endPlayerTurn = () => {
    if (gamePhase === 'finalRound') {
      endGame();
      return;
    }
    setCurrentPlayer('ai');
    setMessage("🤖 AI's turn...");
    setTimeout(() => aiTurn(false), 1000);
  };

  const aiTurn = (isFinalTurn) => {
    if (deck.length === 0) {
      endGame();
      return;
    }
    const card = deck[deck.length - 1];
    const newDeck = deck.slice(0, -1);
    const randomPos = Math.floor(Math.random() * aiHand.length);
    const oldCard = aiHand[randomPos];
    const newHand = [...aiHand];
    newHand[randomPos] = card;
    setAIHand(newHand);
    setDeck(newDeck);
    setDiscardPile(prev => [...prev, oldCard]);
    setTimeout(() => {
      if (!isFinalTurn && gamePhase === 'playing' && Math.random() < 0.15) {
        setCaboCalledBy('ai');
        setGamePhase('finalRound');
        setMessage('🤖 AI called CABO! You get one final turn.');
        setCurrentPlayer('player');
      } else if (isFinalTurn) {
        endGame();
      } else {
        setCurrentPlayer('player');
        setMessage('🎮 Your turn! Click DECK or DISCARD to draw');
      }
    }, 1000);
  };

  const endGame = () => {
    setGamePhase('gameOver');
    const pValue = calculateHandValue(playerHand);
    const aValue = calculateHandValue(aiHand);
    let pFinal = pValue;
    let aFinal = aValue;
    if (caboCalledBy === 'player' && pValue > aValue) {
      pFinal += 5;
    } else if (caboCalledBy === 'ai' && aValue > pValue) {
      aFinal += 5;
    }
    let resultMsg = '';
    if (pFinal < aFinal) {
      resultMsg = `🎉 YOU WIN! Your: ${pFinal} vs AI: ${aFinal}`;
    } else if (aFinal < pFinal) {
      resultMsg = `😞 AI WINS! Your: ${pFinal} vs AI: ${aFinal}`;
    } else {
      resultMsg = `🤝 TIE! Both: ${pFinal}`;
    }
    setMessage(resultMsg);
    setPlayerScore(prev => prev + pFinal);
    setAIScore(prev => prev + aFinal);
    setRevealedCards({
      player: new Set([0, 1, 2, 3]),
      ai: new Set([0, 1, 2, 3])
    });
  };

  const Card = ({ card, revealed, onClick, isDrawn, isDiscard, glow, selected, tempReveal }) => {
    const getGradient = () => {
      if (isDiscard) return 'linear-gradient(135deg, #00ff88 0%, #00d9ff 50%, #bd00ff 100%)';
      return 'linear-gradient(135deg, #ff006e 0%, #bd00ff 50%, #00d9ff 100%)';
    };
    const showValue = revealed || tempReveal;
    return (
      <div onClick={onClick} style={{
        width: isDrawn ? '110px' : '75px',
        height: isDrawn ? '155px' : '110px',
        background: getGradient(),
        borderRadius: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        boxShadow: glow ? '0 0 30px rgba(0, 255, 136, 0.8)' : selected ? '0 0 30px rgba(255, 0, 110, 0.8)' : '0 5px 15px rgba(0,0,0,0.3)',
        border: glow ? '3px solid #00ff88' : selected ? '3px solid #ff006e' : 'none',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
      }}>
        {showValue ? (
          <span style={{ fontSize: isDrawn ? '4em' : '2.5em', fontWeight: '900', color: 'rgba(255,255,255,0.95)' }}>
            {card.value}
          </span>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '2px solid rgba(255,255,255,0.2)',
          }} />
        )}
      </div>
    );
  };

  const getActionIcon = (action) => {
    if (action === 'peek') return <Eye size={20} />;
    if (action === 'spy') return <Users size={20} />;
    if (action === 'swap' || action === 'spyswap') return <ArrowLeftRight size={20} />;
    return null;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0015 0%, #1a0033 50%, #0d001a 100%)',
      padding: '30px 20px',
      fontFamily: 'Arial, sans-serif',
      color: '#fff',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '2.5em',
          background: 'linear-gradient(135deg, #00ff88, #bd00ff, #ff006e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '900',
          marginBottom: '15px',
          letterSpacing: '3px',
        }}>CABO</h1>
        <div style={{ fontSize: '1.1em', marginBottom: '15px', fontWeight: 'bold' }}>
          <span style={{ color: '#00ff88' }}>Player: {playerScore}</span>
          {' | '}
          <span style={{ color: '#ff006e' }}>AI: {aiScore}</span>
        </div>
        <div style={{
          background: 'rgba(0, 217, 255, 0.15)',
          padding: '12px 25px',
          borderRadius: '12px',
          display: 'inline-block',
          border: '2px solid rgba(0, 217, 255, 0.4)',
          fontSize: '1em',
          maxWidth: '600px',
        }}>
          {message}
        </div>
      </div>

      <div style={{ marginBottom: '50px' }}>
        <div style={{ textAlign: 'center', marginBottom: '15px', color: '#ff006e', fontSize: '1.3em', fontWeight: 'bold' }}>
          🤖 AI Hand
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {aiHand.map((card, idx) => (
            <Card 
              key={card.id} 
              card={card} 
              revealed={revealedCards.ai.has(idx)}
              tempReveal={tempRevealed?.target === 'ai' && tempRevealed?.idx === idx}
              onClick={(actionMode === 'spy' || (actionMode === 'spyswap' && actionStep === 0) || (actionMode === 'swap' && actionStep === 1)) ? () => handleActionCardSelect('ai', idx) : null}
              glow={(actionMode === 'spy') || (actionMode === 'spyswap' && actionStep === 0) || (actionMode === 'swap' && actionStep === 1)}
              selected={selectedCards.ai === idx}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '50px', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#00d9ff' }}>DECK ({deck.length})</div>
          <div onClick={drawFromDeck} style={{
            width: '90px',
            height: '125px',
            background: currentPlayer === 'player' && !drawnCard && (gamePhase === 'playing' || gamePhase === 'finalRound')
              ? 'linear-gradient(135deg, #bd00ff 0%, #8800cc 100%)'
              : 'linear-gradient(135deg, #4a0066 0%, #2d0044 100%)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (currentPlayer === 'player' && !drawnCard && (gamePhase === 'playing' || gamePhase === 'finalRound')) ? 'pointer' : 'not-allowed',
            boxShadow: (currentPlayer === 'player' && !drawnCard && (gamePhase === 'playing' || gamePhase === 'finalRound'))
              ? '0 0 25px rgba(189, 0, 255, 0.6)' 
              : '0 5px 15px rgba(0,0,0,0.3)',
            border: (currentPlayer === 'player' && !drawnCard && (gamePhase === 'playing' || gamePhase === 'finalRound'))
              ? '3px solid #bd00ff' 
              : 'none',
            transition: 'all 0.3s ease',
          }}>
            <Shuffle size={40} color="rgba(255,255,255,0.7)" />
          </div>
        </div>

        {drawnCard && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#00ff88' }}>DRAWN CARD</div>
            <Card card={drawnCard} revealed={true} isDrawn={true} glow={true} />
            {getActionType(drawnCard.value) && !actionMode && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button onClick={useAction} style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(0, 255, 136, 0.2)',
                  border: '2px solid #00ff88',
                  borderRadius: '10px',
                  color: '#00ff88',
                  cursor: 'pointer',
                  fontSize: '0.8em',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}>
                  {getActionIcon(getActionType(drawnCard.value))}
                  USE
                </button>
                <button onClick={discardDrawnCard} style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(255, 0, 110, 0.2)',
                  border: '2px solid #ff006e',
                  borderRadius: '10px',
                  color: '#ff006e',
                  cursor: 'pointer',
                  fontSize: '0.8em',
                  fontWeight: 'bold',
                }}>
                  SKIP
                </button>
              </div>
            )}
            {!getActionType(drawnCard.value) && (
              <button onClick={discardDrawnCard} style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: 'rgba(255, 0, 110, 0.2)',
                border: '2px solid #ff006e',
                borderRadius: '10px',
                color: '#ff006e',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
                width: '100%',
              }}>
                DISCARD
              </button>
            )}
            {(actionMode === 'peek' || actionMode === 'spy') && tempRevealed && (
              <button onClick={continueAfterAction} style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: 'rgba(0, 255, 136, 0.2)',
                border: '2px solid #00ff88',
                borderRadius: '10px',
                color: '#00ff88',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
                width: '100%',
              }}>
                CONTINUE
              </button>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.9em', color: '#00ff88' }}>DISCARD</div>
          {discardPile.length > 0 ? (
            <Card 
              card={discardPile[discardPile.length - 1]} 
              revealed={true}
              isDiscard={true}
              onClick={(currentPlayer === 'player' && !drawnCard && (gamePhase === 'playing' || gamePhase === 'finalRound')) ? drawFromDiscard : null}
            />
          ) : (
            <div style={{
              width: '90px',
              height: '125px',
              border: '3px dashed rgba(255,255,255,0.2)',
              borderRadius: '15px',
            }} />
          )}
        </div>
      </div>

      <div>
        <div style={{ textAlign: 'center', marginBottom: '15px', color: '#00ff88', fontSize: '1.3em', fontWeight: 'bold' }}>
          👤 Your Hand
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {playerHand.map((card, idx) => (
            <Card 
              key={card.id} 
              card={card} 
              revealed={revealedCards.player.has(idx)}
              tempReveal={tempRevealed?.target === 'player' && tempRevealed?.idx === idx}
              onClick={
                drawnCard && !actionMode ? () => replaceCard(idx) : 
                (gamePhase === 'setup' && revealedCards.player.size < 2) ? () => revealSetupCard(idx) :
                (actionMode === 'peek') ? () => handleActionCardSelect('player', idx) :
                (actionMode === 'swap' && actionStep === 0) ? () => handleActionCardSelect('player', idx) :
                (actionMode === 'spyswap' && actionStep === 1) ? () => handleActionCardSelect('player', idx) :
                null
              }
              glow={
                (drawnCard && !actionMode) || 
                (gamePhase === 'setup' && revealedCards.player.size < 2) ||
                (actionMode === 'peek') ||
                (actionMode === 'swap' && actionStep === 0) ||
                (actionMode === 'spyswap' && actionStep === 1)
              }
              selected={selectedCards.player === idx}
            />
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {gamePhase === 'playing' && currentPlayer === 'player' && !drawnCard && !actionMode && (
          <button onClick={callCabo} style={{
            padding: '18px 40px',
            background: 'linear-gradient(135deg, #ff006e, #bd00ff)',
            border: 'none',
            borderRadius: '15px',
            color: '#fff',
            fontSize: '1.4em',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(255,0,110,0.5)',
            letterSpacing: '2px',
          }}>
            CALL CABO
          </button>
        )}
        {gamePhase === 'gameOver' && (
          <button onClick={initGame} style={{
            padding: '18px 40px',
            background: 'linear-gradient(135deg, #00ff88, #00d9ff)',
            border: 'none',
            borderRadius: '15px',
            color: '#000',
            fontSize: '1.3em',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0,255,136,0.5)',
            letterSpacing: '2px',
          }}>
            NEW ROUND
          </button>
        )}
      </div>
    </div>
  );
};

export default CaboGame;
