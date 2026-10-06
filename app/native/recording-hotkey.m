#import <AppKit/AppKit.h>
#include <Carbon/Carbon.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

static CGKeyCode recordingKey;
static CGEventFlags requiredFlags;
static bool armed;
static bool held;

// Electron only reports a press. This helper also reports a release.
static OSStatus onHotkey(EventHandlerCallRef next, EventRef event, void *context) {
  (void)next;
  (void)context;
  bool down = GetEventKind(event) == kEventHotKeyPressed;
  if (!armed) {
    if (!down) armed = true;
    return noErr;
  }
  if (down != held) {
    held = down;
    puts(down ? "down" : "up");
  }
  return noErr;
}

static void checkState(CFRunLoopTimerRef timer, void *context) {
  (void)timer;
  if (getppid() != *(pid_t *)context) exit(0);
  bool keyDown = CGEventSourceKeyState(kCGEventSourceStateCombinedSessionState, recordingKey);
  CGEventFlags flags = CGEventSourceFlagsState(kCGEventSourceStateCombinedSessionState);
  // Ignore keys still held while setting the shortcut.
  if (!armed && !keyDown) armed = true;
  // Stop when any shortcut key is released.
  if (held && (!keyDown || (flags & requiredFlags) != requiredFlags)) {
    held = false;
    puts("up");
  }
}

int main(int argc, char **argv) {
  @autoreleasepool {
    if (argc != 4) return 1;
    pid_t parent = (pid_t)strtol(argv[3], NULL, 10);
    if (getppid() != parent) return 1;
    setbuf(stdout, NULL);
    [NSApplication sharedApplication];
    [NSApp setActivationPolicy:NSApplicationActivationPolicyProhibited];
    recordingKey = (CGKeyCode)strtoul(argv[1], NULL, 10);
    UInt32 modifiers = (UInt32)strtoul(argv[2], NULL, 10);
    if (modifiers & cmdKey) requiredFlags |= kCGEventFlagMaskCommand;
    if (modifiers & optionKey) requiredFlags |= kCGEventFlagMaskAlternate;
    if (modifiers & controlKey) requiredFlags |= kCGEventFlagMaskControl;
    if (modifiers & shiftKey) requiredFlags |= kCGEventFlagMaskShift;
    armed = !CGEventSourceKeyState(kCGEventSourceStateCombinedSessionState, recordingKey);

    const EventTypeSpec events[] = {
      {kEventClassKeyboard, kEventHotKeyPressed},
      {kEventClassKeyboard, kEventHotKeyReleased}
    };
    OSStatus status = InstallApplicationEventHandler(onHotkey, 2, events, NULL, NULL);
    if (status != noErr) {
      fputs("Could not listen for recording shortcuts. Restart Benson and try again.\n", stderr);
      return 1;
    }

    EventHotKeyRef hotkey;
    EventHotKeyID identifier = {'Bnsn', 1};
    status = RegisterEventHotKey(recordingKey, modifiers, identifier,
                                GetApplicationEventTarget(), kEventHotKeyExclusive, &hotkey);
    if (status != noErr) {
      fputs("That shortcut is unavailable. Try another combination.\n", stderr);
      return 1;
    }

    // Stop this helper if Benson closes.
    CFRunLoopTimerContext context = {0, &parent, NULL, NULL, NULL};
    CFRunLoopTimerRef timer = CFRunLoopTimerCreate(NULL, CFAbsoluteTimeGetCurrent() + 0.1,
                                                  0.1, 0, 0, checkState, &context);
    CFRunLoopAddTimer(CFRunLoopGetCurrent(), timer, kCFRunLoopCommonModes);
    puts("ready");
    [NSApp run];
    UnregisterEventHotKey(hotkey);
    CFRelease(timer);
    return 0;
  }
}
