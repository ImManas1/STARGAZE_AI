# services/ai_service.py

def get_stargazing_suggestion(weather, visibility):
    if weather == "clear" and visibility == "high":
        return "Perfect night for stargazing!"
    elif weather == "cloudy":
        return "Not ideal due to clouds"
    else:
        return "Conditions are average"