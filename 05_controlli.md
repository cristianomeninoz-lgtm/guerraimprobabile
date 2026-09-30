# Controlli — UNHINGED WARFARE

Schema ibrido da brawler/action arcade, pensato per essere immediato ma con
profondità nelle combo. I tasti elencati sono quelli implementati nel gioco.

## Mobile (touch screen)
- **Stick virtuale sinistro**: movimento continuo; nel renderer 3D sposta anche
  il personaggio tra le corsie.
- **Pulsante A**: attacco base, mantenibile per combo.
- **Pulsante B**: abilità folle (cooldown).
- **Pulsante C**: scatto con breve invulnerabilità.
- **Pulsante Caos (⚡)**: finisher quando la barra caos è piena.
- **Pulsante pausa**: sospende e riprende la partita.
- Nelle impostazioni, **PILLS** apre la tastiera del codice segreto; si può digitare
  anche con la tastiera fisica e confermare con Invio.
- I tocchi simultanei su stick e pulsanti d’azione sono supportati; il salto e
  il doppio tap/mira non sono attualmente implementati.

## Segreti e armi temporanee
- Quattro vasi speciali, uno in ciascuno dei livelli 2, 5, 8 e 11, nascondono
  segreti persistenti: rompi il vaso per ottenere guarigione, carica caos e un
  potere temporaneo. Il bagliore è volutamente sottile.
- Rompere i vasi normali può assegnare un'arma casuale temporanea; l'HUD mostra
  il nome e il conto alla rovescia (circa 11 secondi).
- Ogni colpo produce solo pochi schizzi rossi stilizzati, che svaniscono subito.

## Tastiera
- **WASD o frecce**: movimento.
- **J/Z o Spazio**: attacco; **K/X/V**: abilità; **L/C/B**: finisher.
- **Shift**: scatto; **E/Invio**: interagisci; **Esc/P**: pausa.
- **Q/R**: sposta lo sguardo della camera (si ricentra gradualmente); **Alt+frecce**: alternativa per orientarla.

## Duello locale (due giocatori sullo stesso dispositivo)
- **P1**: WASD per muoversi; J attacco, K abilità, L finisher, Shift scatto.
- **P2**: frecce per muoversi; F attacco, G abilità, H finisher, N scatto.
- **Due gamepad**: il primo controller collegato controlla P1 e il secondo P2;
  mappatura azioni uguale a quella della sezione controller.

## Controller (Gamepad API del browser)
- **Stick sinistro**: movimento e corsie nel renderer 3D.
- **X (pulsante indice 2)**: attacco; **Y (3)**: abilità; **LB (4)**: finisher;
  **B/Cerchio (1)**: scatto; **RB (5)**: interazione; **Start (9)**: pausa.
- **Stick destro orizzontale (asse 2)**: orienta la camera; ritorna al centro
  gradualmente quando la levetta è rilasciata.
- La mappatura varia con il controller/browser; salto, mira e cambio arma non
  sono implementati.

## Principi di game feel
- **Input buffering**: i comandi d’attacco/abilità/finisher disponibili
  vengono mantenuti brevemente, così i tocchi anticipati non si perdono.
- **Feedback aptico**: vibrazioni brevi su danni e interazioni quando
  l’opzione aptica è abilitata e il browser supporta `navigator.vibrate`.
- **Telecamera dinamica**: leggero zoom-in automatico durante le mosse
  speciali/caos, in stile slow-motion cinematografico per rendere le clip
  condivisibili più spettacolari.
