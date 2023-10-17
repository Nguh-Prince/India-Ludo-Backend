export function validateString(string, regex) {
    return regex.test(string)
}

export function validatePassword(password) {
    let passwordRegex = /^(?=.*[0-9])(?=.*[- ?!@#$%^&*\+-\/\\])(?=.*[A-Z])(?=.*[a-z])[a-zA-Z0-9- ?!@#$%^&*\+-\/]{8,30}$/

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