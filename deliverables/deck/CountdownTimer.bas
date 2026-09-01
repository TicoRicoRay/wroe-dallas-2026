Attribute VB_Name = "CountdownTimer"
' =========================================================================
' WRoEOS North Texas 2026 — Break Slide Countdown Timer
' =========================================================================
' Auto-detects break slides by looking for a text box named
' "CountdownTimer_NN" (where NN is the break length in minutes) and counts
' down mm:ss until zero, then shows "Time's up!".
'
' Setup:
'   1. In PowerPoint, open the .pptm file.
'   2. Alt+F11 opens the VBA editor.
'   3. Insert > Module, then paste this code.
'   4. File > Save (keep .pptm).
'   5. Enable macros when prompted next time you open the file.
'
' Usage:
'   During presentation, when a break slide appears the timer starts
'   automatically. Advance the slide (spacebar / arrow) to leave the break
'   and stop the timer.
'
' Slide-tag naming convention (already in the deck):
'   Any text box with a Name property starting "CountdownTimer_" is treated
'   as a countdown display. The number after the underscore = minutes.
'   Example: "CountdownTimer_20" = 20-minute break.
' =========================================================================

Option Explicit

' Module-level state
Private mTimerActive As Boolean
Private mEndTime As Date
Private mDisplayShape As Shape
Private mSlideIndex As Long

' Called automatically when a slide is displayed during Slide Show mode.
' PowerPoint fires this via the SlideShowNextSlide event; we hook it below.
Public Sub StartCountdownOnSlide(ByVal sldIndex As Long)
    Dim sld As Slide
    Dim shp As Shape
    Dim minutes As Long
    Dim shapeName As String

    Set sld = ActivePresentation.Slides(sldIndex)

    ' Find the CountdownTimer_NN shape on this slide
    For Each shp In sld.Shapes
        shapeName = shp.Name
        If Left(shapeName, 16) = "CountdownTimer_" Then
            minutes = CLng(Mid(shapeName, 17))
            Set mDisplayShape = shp
            mSlideIndex = sldIndex
            mEndTime = Now + TimeSerial(0, minutes, 0)
            mTimerActive = True
            Call TickTimer
            Exit Sub
        End If
    Next shp
End Sub

' Called by Application.OnTime once a second while the timer is active.
Public Sub TickTimer()
    Dim remaining As Date
    Dim mins As Long, secs As Long
    Dim displayText As String

    If Not mTimerActive Then Exit Sub

    ' Verify we're still on the same slide (advance = stop)
    If SlideShowWindows.Count = 0 Then
        mTimerActive = False
        Exit Sub
    End If

    If SlideShowWindows(1).View.Slide.SlideIndex <> mSlideIndex Then
        mTimerActive = False
        Exit Sub
    End If

    remaining = mEndTime - Now
    If remaining <= 0 Then
        mDisplayShape.TextFrame.TextRange.Text = "0:00"
        mTimerActive = False
        ' Optional: flash red or say "Time's up"
        mDisplayShape.TextFrame.TextRange.Text = "Time's up"
        Exit Sub
    End If

    mins = Int(remaining * 24 * 60)
    secs = Int((remaining * 24 * 60 * 60) - (mins * 60))
    displayText = mins & ":" & Format(secs, "00")

    On Error Resume Next
    mDisplayShape.TextFrame.TextRange.Text = displayText
    On Error GoTo 0

    ' Schedule next tick
    Application.OnTime Now + TimeSerial(0, 0, 1), "CountdownTimer.TickTimer"
End Sub

' Hook for the SlideShowNextSlide event (put this in ThisPresentation):
'   Private Sub App_SlideShowNextSlide(ByVal Wn As SlideShowWindow)
'       CountdownTimer.StartCountdownOnSlide Wn.View.Slide.SlideIndex
'   End Sub
