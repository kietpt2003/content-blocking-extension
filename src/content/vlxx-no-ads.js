// Replacement for /vlxx/vl-inplayer-adx.js only. The real embed-vast.js
// waits for funcGetvastAdx() before setting up JW Player with its original sources.
window.COUNT_VAST = 0;
window.funcGetvastAdx = () => [];
window.funcJWonReadyVAST = () => {};
