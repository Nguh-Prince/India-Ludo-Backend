export function validateString(string, regex) {
    return regex.test(string)
}

export function validatePassword(password) {
    let passwordRegex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,30}$/gm
    return validateString(password, passwordRegex);
}

export function validateEmail(email) {
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return validateString(email, emailRegex);
}

export function validateName(name) {
    let nameRegex = /^\s*(\S+)\s+(?:\S+\s+)*?(\S+)\s*$/;

    return validateString(name, nameRegex)
}