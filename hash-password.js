const bcrypt = require('bcrypt');

async function generateHash(plainPassword) {
  try {
    const saltRounds = 10; // Good balance: secure but not too slow for your app
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    console.log(`Plain: "${plainPassword}" → Hash: ${hash}`);
    return hash;
  } catch (error) {
    console.error('Hash error:', error);
  }
}

generateHash('army123'); // Change this password as needed for testing
