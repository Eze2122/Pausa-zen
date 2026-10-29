import random
errs = []
page.on("pageerror", lambda e: errs.append(str(e)[:200]))
await page.set_viewport_size({"width": 390, "height": 844})
base = "https://pausa-zen--6l2nj142.preview.emergentagent.com"
results = {}
await page.goto(base); await page.wait_for_timeout(2500)
for gid in IDS:
    try:
        e0 = len(errs)
        await page.goto(f"{base}/play/{gid}?mode=free")
        await page.wait_for_selector('[data-testid="game-start-button"]', timeout=10000)
        await page.click('[data-testid="game-start-button"]', force=True)
        await page.wait_for_timeout(500)
        if await page.locator('[data-testid="game-board"]').count() == 0:
            results[gid] = "NO BOARD"; continue
        bb = await page.locator('[data-testid="game-board"]').first.bounding_box()
        x0, y0, w, h = bb["x"], bb["y"], bb["width"], bb["height"]
        random.seed(gid)
        for i in range(10):
            x = x0 + w * random.uniform(0.1, 0.9); y = y0 + h * random.uniform(0.1, 0.9)
            await page.mouse.move(x, y); await page.mouse.down(); await page.wait_for_timeout(80 if i % 3 else 500); await page.mouse.up()
        for i in range(3):
            sx = x0 + w * random.uniform(0.2, 0.8); sy = y0 + h * random.uniform(0.2, 0.8)
            await page.mouse.move(sx, sy); await page.mouse.down()
            for k in range(1, 6):
                await page.mouse.move(sx + (w * 0.2) * k / 5 * (1 if i % 2 else -1), sy + (h * 0.25) * k / 5)
                await page.wait_for_timeout(20)
            await page.mouse.up()
        await page.wait_for_timeout(300)
        sc = (await page.locator('[data-testid="game-score"]').inner_text()).strip()
        fin = await page.locator('[data-testid="game-finish-button"]').count()
        results[gid] = f"score={sc} board={int(w)}x{int(h)} errs={errs[e0:]} fin={fin}"
    except Exception as ex:
        results[gid] = f"EXC {str(ex)[:120]}"
for k, v in results.items():
    print(k, "->", v)
