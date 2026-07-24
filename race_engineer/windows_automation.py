"""Small, narrowly scoped Windows UI automation helpers."""

import base64
import csv
import ctypes
import io
import os
import subprocess
import time
from ctypes import wintypes


_TAKE_SEAT_SCRIPT = r"""
Add-Type -AssemblyName UIAutomationClient
$root = [System.Windows.Automation.AutomationElement]::RootElement
$name = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::NameProperty,
    'Take Seat'
)
$matches = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $name)
foreach ($element in $matches) {
    try {
        $process = Get-Process -Id $element.Current.ProcessId -ErrorAction Stop
        if ($process.ProcessName -notmatch '(?i)iRacing') { continue }

        $pattern = $null
        if ($element.TryGetCurrentPattern(
            [System.Windows.Automation.InvokePattern]::Pattern,
            [ref]$pattern
        )) {
            $pattern.Invoke()
            Write-Output 'invoked'
            exit 0
        }

        if ($element.TryGetCurrentPattern(
            [System.Windows.Automation.LegacyIAccessiblePattern]::Pattern,
            [ref]$pattern
        )) {
            $pattern.DoDefaultAction()
            Write-Output 'invoked'
            exit 0
        }
    } catch { continue }
}
Write-Error 'The iRacing Take Seat button is not available to Windows UI Automation.'
exit 2
"""

_LEAVE_SEAT_SCRIPT = _TAKE_SEAT_SCRIPT.replace("Take Seat", "Leave Seat")


def _invoke_accessible_take_seat(timeout):
    encoded = base64.b64encode(_TAKE_SEAT_SCRIPT.encode("utf-16-le")).decode("ascii")
    try:
        result = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-EncodedCommand",
                encoded,
            ],
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("Timed out while looking for iRacing's Take Seat button") from exc
    except OSError as exc:
        raise RuntimeError("Windows UI Automation could not be started") from exc

    return result.returncode == 0


def _invoke_accessible_leave_seat(timeout):
    encoded = base64.b64encode(_LEAVE_SEAT_SCRIPT.encode("utf-16-le")).decode("ascii")
    try:
        result = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-NonInteractive",
                "-EncodedCommand",
                encoded,
            ],
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("Timed out while looking for iRacing's Leave Seat button") from exc
    except OSError as exc:
        raise RuntimeError("Windows UI Automation could not be started") from exc

    return result.returncode == 0


def _iracing_sim_process_ids():
    result = subprocess.run(
        [
            "tasklist.exe",
            "/FI",
            "IMAGENAME eq iRacingSim64DX11.exe",
            "/FO",
            "CSV",
            "/NH",
        ],
        capture_output=True,
        text=True,
        timeout=2.0,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    process_ids = set()
    for row in csv.reader(io.StringIO(result.stdout or "")):
        if len(row) >= 2 and row[0].lower() == "iracingsim64dx11.exe":
            try:
                process_ids.add(int(row[1]))
            except ValueError:
                continue
    return process_ids


def _click_take_seat_at_relative_position():
    """Click the rendered Take Seat control, which iRacing does not expose to UIA."""
    if os.name != "nt":
        return False

    process_ids = _iracing_sim_process_ids()
    if not process_ids:
        return False

    user32 = ctypes.windll.user32
    windows = []
    enum_callback_type = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    def collect_window(hwnd, _lparam):
        process_id = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(process_id))
        if process_id.value not in process_ids or not user32.IsWindowVisible(hwnd):
            return True
        rect = wintypes.RECT()
        if user32.GetWindowRect(hwnd, ctypes.byref(rect)):
            width = rect.right - rect.left
            height = rect.bottom - rect.top
            if width >= 800 and height >= 450:
                windows.append((width * height, hwnd, rect))
        return True

    callback = enum_callback_type(collect_window)
    user32.EnumWindows(callback, 0)
    if not windows:
        return False

    _area, hwnd, rect = max(windows, key=lambda item: item[0])
    width = rect.right - rect.left
    height = rect.bottom - rect.top
    # Measured from the supplied full iRacing screenshot. Relative coordinates
    # keep the target stable across fullscreen resolutions and aspect ratios.
    x = rect.left + round(width * 0.6414)
    y = rect.top + round(height * 0.6753)
    previous = wintypes.POINT()
    user32.GetCursorPos(ctypes.byref(previous))
    user32.ShowWindow(hwnd, 9)  # SW_RESTORE; harmless for borderless fullscreen.
    user32.SetForegroundWindow(hwnd)
    time.sleep(0.2)
    user32.SetCursorPos(x, y)
    user32.mouse_event(0x0002, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTDOWN
    user32.mouse_event(0x0004, 0, 0, 0, 0)  # MOUSEEVENTF_LEFTUP
    time.sleep(0.1)
    user32.SetCursorPos(previous.x, previous.y)
    return True


def invoke_iracing_take_seat(timeout=5.0):
    """Invoke iRacing's Take Seat control using UIA, then a visual fallback."""
    if _invoke_accessible_take_seat(timeout):
        return True
    if _click_take_seat_at_relative_position():
        return True
    raise RuntimeError(
        "iRacing's Take Seat button was not found. Make sure the simulator is visible."
    )


def invoke_iracing_leave_seat(timeout=5.0):
    """Invoke iRacing's Leave Seat control using UIA, then a visual fallback."""
    if _invoke_accessible_leave_seat(timeout):
        return True
    if _click_take_seat_at_relative_position():
        return True
    raise RuntimeError(
        "iRacing's Leave Seat button was not found. Make sure the simulator is visible."
    )
