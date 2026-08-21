using Microsoft.Playwright;
using NUnit.Framework;

namespace Gavel.Fixtures;

// Lesson #12 shape: client-style new TransferenciaRapidaPage(page) inside [Test].
public class TransferenciaTests
{
    [Test]
    public void TransferenciaRapida_ConstructsPageDirectly()
    {
        var page = new TransferenciaRapidaPage(null!);
        page.EjecutarTransferencia();
    }
}

public class TransferenciaRapidaPage
{
    public TransferenciaRapidaPage(IPage page) { }
    public void EjecutarTransferencia() { }
}
