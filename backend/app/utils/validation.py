def translate_validation_errors(error: dict) -> dict:
    """
    Translates Pydantic/FastAPI validation error messages to French.
    """
    translated_error = dict(error)
    err_type = error.get("type", "")
    ctx = error.get("ctx", {})
    msg = error.get("msg", "")

    if err_type == "missing":
        translated_error["msg"] = "Ce champ est obligatoire."
    elif err_type == "string_too_short":
        limit = ctx.get("min_length", ctx.get("limit_value", 6))
        suffix = "caractère" if limit == 1 else "caractères"
        translated_error["msg"] = f"Ce champ doit contenir au moins {limit} {suffix}."
    elif err_type == "string_too_long":
        limit = ctx.get("max_length", ctx.get("limit_value", 255))
        suffix = "caractère" if limit == 1 else "caractères"
        translated_error["msg"] = f"Ce champ ne doit pas dépasser {limit} {suffix}."
    elif err_type == "value_error" or err_type.startswith("value_error."):
        if "email" in msg.lower() or any(isinstance(l, str) and "email" in l.lower() for l in error.get("loc", [])):
            translated_error["msg"] = "Adresse email invalide."
        elif msg.startswith("Value error, "):
            translated_error["msg"] = msg[len("Value error, "):]
        else:
            translated_error["msg"] = msg
    elif err_type in ("invalid_email", "email_parsing"):
        translated_error["msg"] = "Adresse email invalide."
    elif err_type in ("int_parsing", "int_type"):
        translated_error["msg"] = "La valeur doit être un nombre entier valide."
    elif err_type in ("float_parsing", "float_type"):
        translated_error["msg"] = "La valeur doit être un nombre décimal valide."
    elif err_type in ("bool_parsing", "bool_type"):
        translated_error["msg"] = "La valeur doit être un booléen valide."
    elif err_type == "enum":
        permitted = ctx.get("expected", "")
        translated_error["msg"] = f"Valeur invalide. Les valeurs autorisées sont : {permitted}."
    elif err_type in ("datetime_parsing", "datetime_type"):
        translated_error["msg"] = "La date et l'heure fournies ne sont pas valides."
    elif err_type in ("date_parsing", "date_type"):
        translated_error["msg"] = "La date fournie n'est pas valide."
    elif err_type in ("time_parsing", "time_type"):
        translated_error["msg"] = "L'heure fournie n'est pas valide."
    elif "less_than_equal" in err_type:
        le = ctx.get("le", ctx.get("limit_value", ""))
        translated_error["msg"] = f"La valeur doit être inférieure ou égale à {le}."
    elif "less_than" in err_type:
        lt = ctx.get("lt", ctx.get("limit_value", ""))
        translated_error["msg"] = f"La valeur doit être strictement inférieure à {lt}."
    elif "greater_than_equal" in err_type:
        ge = ctx.get("ge", ctx.get("limit_value", ""))
        translated_error["msg"] = f"La valeur doit être supérieure ou égale à {ge}."
    elif "greater_than" in err_type:
        gt = ctx.get("gt", ctx.get("limit_value", ""))
        translated_error["msg"] = f"La valeur doit être strictement supérieure à {gt}."

    return translated_error
