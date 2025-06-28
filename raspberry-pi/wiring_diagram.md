# INMP441 Microphone to Raspberry Pi Wiring

## Hardware Requirements
- Raspberry Pi (3B+, 4B, or newer)
- INMP441 I2S MEMS Microphone
- Jumper wires
- Breadboard (optional)

## Wiring Diagram

```
INMP441 Microphone    Raspberry Pi
┌─────────────┐      ┌─────────────┐
│             │      │             │
│   VDD ──────┼──────┤ 3.3V        │
│             │      │             │
│   GND ──────┼──────┤ GND         │
│             │      │             │
│   SD  ──────┼──────┤ GPIO 21     │ (BCM 21)
│             │      │             │
│   L/R ──────┼──────┤ GPIO 20     │ (BCM 20)
│             │      │             │
│   SCK ──────┼──────┤ GPIO 18     │ (BCM 18)
│             │      │             │
└─────────────┘      └─────────────┘
```

## Pin Connections

| INMP441 Pin | Raspberry Pi Pin | Description |
|-------------|------------------|-------------|
| VDD         | 3.3V            | Power supply |
| GND         | GND             | Ground       |
| SD          | GPIO 21 (BCM)   | Data line    |
| L/R         | GPIO 20 (BCM)   | Left/Right select |
| SCK         | GPIO 18 (BCM)   | Clock signal |

## Setup Instructions

1. **Power off your Raspberry Pi** before making connections

2. **Connect the INMP441 microphone:**
   - VDD → 3.3V
   - GND → GND
   - SD → GPIO 21
   - L/R → GPIO 20
   - SCK → GPIO 18

3. **Enable I2S in Raspberry Pi config:**
   ```bash
   sudo raspi-config
   ```
   - Go to "Interface Options"
   - Enable "I2S"
   - Reboot

4. **Verify I2S is enabled:**
   ```bash
   lsmod | grep snd_soc_i2s
   ```

5. **Test microphone:**
   ```bash
   # Install test tools
   sudo apt-get install alsa-utils
   
   # Test recording
   arecord -D hw:1,0 -f S16_LE -r 44100 -c 1 test.wav
   
   # Play back (optional)
   aplay test.wav
   ```

## Troubleshooting

### No sound detected
- Check all connections
- Verify I2S is enabled
- Check microphone orientation
- Try different GPIO pins if needed

### Poor audio quality
- Ensure stable power supply
- Check for interference
- Verify sample rate settings
- Check microphone placement

### Permission errors
- Add user to audio group:
  ```bash
  sudo usermod -a -G audio $USER
  ```
- Reboot after adding to group

## Alternative Wiring (if I2S doesn't work)

If you have issues with I2S, you can use the microphone with an ADC:

```
INMP441 → ADC (ADS1115) → Raspberry Pi I2C
```

This requires additional code changes but may be more reliable on some Pi models. 