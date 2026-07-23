<template>
    <nav class="nav d-flex align-items-center justify-content-center position-relative">
      <RouterLink to="/" class="position-absolute start-0 brand-logo">
        <span class="brand-logo__icon">🍱</span>
        <span class="brand-logo__text">等等吃什麼</span>
      </RouterLink>

      <div class="d-flex align-items-center justify-content-center">
        <RouterLink to="/" class="nav-link-custom">首頁</RouterLink>
        <RouterLink to="/wheel" class="nav-link-custom">今天吃什麼</RouterLink>
        <RouterLink to="/lunch-group" class="nav-link-custom">開團點餐</RouterLink>
        <RouterLink to="/split-result" class="nav-link-custom">分帳結果</RouterLink>
      </div>

      <div class="position-absolute end-0">
        <RouterLink to="/wheel" class="btn-primary-custom">建立午餐團</RouterLink>
      </div>
    </nav>
</template>