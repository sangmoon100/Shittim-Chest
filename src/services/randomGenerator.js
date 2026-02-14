const { randomInt } = require('crypto');

let next = 1;
let a = 0;
let c = 0;
const m = 2 ** 7;

function initRandom(seed) {
    // 시드 기반으로 소수 후보 선택
    const primes = [];
    for (let i = 2; i <= seed ** 2; i++) {
        if (isPrim(i) && seed < i) primes.push(i);
    }
    // crypto 기반 셔플 (Fisher-Yates)
    for (let i = primes.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [primes[i], primes[j]] = [primes[j], primes[i]];
    }
    next = seed;
    primes.forEach((value) => {
        if (value > 1000) a = value;
        if (value > 10 && value < 1000) c = value;
    });
}

// 소수 체크
function isPrim(num) {
    if (num < 2) return false;
    if (num === 2) return true;
    if (num === 3) return true;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

// 선형 합동 생성기
// Xn+1 =(a * Xn + c) mod m
function _LinearCongruential() {
    next = (a * next + c) % m;
    return next;
}

function getRandomIndex(max) {
    if (!Number.isInteger(max) || max <= 0) {
        throw new Error('max는 1 이상의 정수여야 합니다.');
    }
    return _LinearCongruential() % max;
}

initRandom(103);

module.exports = { getRandomIndex, initRandom };
