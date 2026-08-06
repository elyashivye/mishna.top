<?php $quote = randomFooterQuote(); ?>
<footer class="px-4 md:px-10 py-8 mt-6">
    <div class="flex items-center justify-center gap-3 text-center flex-wrap">
        <span class="text-gold"><?= icon('heart', 'w-5 h-5') ?></span>
        <p class="text-ink/70 text-sm">
            <span class="font-semibold text-navy">"<?= h($quote['text']) ?>"</span>
            <span class="text-ink/50"> — <?= h($quote['source']) ?></span>
        </p>
    </div>
</footer>
