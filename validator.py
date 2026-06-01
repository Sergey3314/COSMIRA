import re

def validate_date(d):
    if not re.match(r"^\d{2}\.\d{2}\.\d{4}$", d): 
        return False, "Формат: ДД.ММ.ГГГГ"
    return True, ""

def validate_time(t):
    if not re.match(r"^\d{2}:\d{2}$", t): 
        return False, "Формат: ЧЧ:ММ"
    h, m = map(int, t.split(":"))
    if 0 <= h <= 23 and 0 <= m <= 59: 
        return True, ""
    return False, "Время вне диапазона 00:00–23:59"

def validate_place(p):
    if len(p.strip()) < 2: 
        return False, "Укажи город или населённый пункт"
    return True, ""