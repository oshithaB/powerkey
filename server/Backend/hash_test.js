const bcrypt = require('bcrypt');

const passwordOne = 'test1234';
const passwordTwo = 'test1234';

const hashPassword = async (password) => {
    if (!password) {
        throw new Error('Password is required');
    }
    const saltRounds = 10;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw error;
    }
}

(async () => {
    console.log('hashpasswordOne:', await hashPassword(passwordOne));
    console.log('hashpasswordTwo:', await hashPassword(passwordTwo));
})();
