using System;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Appium;
using Sample.AppiumDotnet.Pages.Locators;

namespace Sample.AppiumDotnet.Pages.Actions;

// VIOLATION FILE: demonstrates gesture leak, MobileBy deprecation, and
// context-switch selector leak. Do not copy into a real suite.
public class MobileGestureActionsBad
{
    // VIOLATION: selector-leak — MobileBy is deprecated, use AppiumBy.*
    public void TapLegacyElement(AppiumDriver driver)
    {
        driver.FindElement(MobileBy.AndroidUIAutomator("new UiSelector().text(\"OK\")")).Click();
    }

    // VIOLATION: selector-leak — inline FindElement with CSS in an action
    public void SwitchToWebAndFind(AppiumDriver driver)
    {
        driver.Context = "WEBVIEW_com.example";
        driver.FindElement(By.CssSelector(".consent-banner")).Click();
        driver.Context = "NATIVE_APP";
    }

    // VIOLATION: selector-leak — inline gesture coordinates in an action
    public void SwipeUpBad(AppiumDriver driver)
    {
        var finger = new OpenQA.Selenium.Interactions.PointerInputDevice(OpenQA.Selenium.Interactions.PointerKind.Touch, "finger");
        var swipe = new OpenQA.Selenium.Interactions.ActionSequence(finger);
        swipe.AddAction(finger.CreatePointerMove(CoordinateOrigin.Viewport, 200, 800, TimeSpan.Zero));
        swipe.AddAction(finger.CreatePointerDown(OpenQA.Selenium.Interactions.MouseButton.Left));
        swipe.AddAction(finger.CreatePointerMove(CoordinateOrigin.Viewport, 200, 200, TimeSpan.FromMilliseconds(300)));
        swipe.AddAction(finger.CreatePointerUp(OpenQA.Selenium.Interactions.MouseButton.Left));
        driver.PerformActions(new System.Collections.Generic.List<OpenQA.Selenium.Interactions.ActionSequence> { swipe });
    }
}
