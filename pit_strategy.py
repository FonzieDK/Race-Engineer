import json

class PitStrategy:
    def __init__(self, config_file='config.json'):
        with open(config_file, 'r') as f:
            self.config = json.load(f)

    def calculate_pit_stop(self, fuel_level, laps_remaining, fuel_per_lap):
        """Calculate if a pit stop is needed based on fuel."""
        if fuel_per_lap <= 0:
            return False, "Fuel consumption data not available."

        fuel_needed = laps_remaining * fuel_per_lap
        if fuel_level < fuel_needed + self.config.get('fuel_warning_threshold', 5.0):
            return True, f"Pit stop recommended. Fuel needed: {fuel_needed:.1f}, Current: {fuel_level:.1f}"
        return False, "No pit stop needed."

    def check_tire_wear(self, tire_wear):
        """Check if tires need changing."""
        threshold = self.config.get('tire_wear_warning', 0.8)
        for position, wear in tire_wear.items():
            if wear > threshold:
                return True, f"Tire wear high on {position}: {wear:.2f}"
        return False, "Tires OK."