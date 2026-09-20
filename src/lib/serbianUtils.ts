/**
 * Transliterates Serbian Latin and Cyrillic characters to ASCII equivalents for usernames.
 * e.g., "Pera" + "Perić" -> "pera.peric"
 * "Miloš" + "Čvorović" -> "milos.cvorovic"
 * "Đorđe" + "Božić" -> "djordje.bozic"
 */
export function transliterateSerbian(input: string): string {
  if (!input) return '';

  const charMap: Record<string, string> = {
    // Serbian Latin diacritics
    'č': 'c', 'Č': 'c',
    'ć': 'c', 'Ć': 'c',
    'đ': 'dj', 'Đ': 'dj',
    'š': 's', 'Š': 's',
    'ž': 'z', 'Ž': 'z',

    // Serbian Cyrillic alphabet
    'а': 'a', 'А': 'a',
    'б': 'b', 'Б': 'b',
    'в': 'v', 'В': 'v',
    'г': 'g', 'Г': 'g',
    'д': 'd', 'Д': 'd',
    'ђ': 'dj', 'Ђ': 'dj',
    'е': 'e', 'Е': 'e',
    'ж': 'z', 'Ж': 'z',
    'з': 'z', 'З': 'z',
    'и': 'i', 'И': 'i',
    'ј': 'j', 'Ј': 'j',
    'к': 'k', 'К': 'k',
    'л': 'l', 'Л': 'l',
    'љ': 'lj', 'Љ': 'lj',
    'м': 'm', 'М': 'm',
    'н': 'n', 'Н': 'n',
    'њ': 'nj', 'Њ': 'nj',
    'о': 'o', 'О': 'o',
    'п': 'p', 'P': 'p',
    'р': 'r', 'Р': 'r',
    'с': 's', 'С': 's',
    'т': 't', 'Т': 't',
    'ћ': 'c', 'Ћ': 'c',
    'у': 'u', 'У': 'u',
    'ф': 'f', 'Ф': 'f',
    'х': 'h', 'Х': 'h',
    'ц': 'c', 'Ц': 'c',
    'ч': 'c', 'Ч': 'c',
    'џ': 'dz', 'Џ': 'dz',
    'ш': 's', 'Ш': 's',
  };

  return input
    .split('')
    .map((char) => charMap[char] ?? char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Generates standard username in format: ime.prezime (e.g. pera.peric)
 */
export function generateStudentUsername(name: string, surname: string): string {
  const cleanName = transliterateSerbian(name.trim());
  const cleanSurname = transliterateSerbian(surname.trim());
  return `${cleanName}.${cleanSurname}`;
}
