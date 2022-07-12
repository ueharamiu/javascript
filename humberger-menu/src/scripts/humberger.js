const humberger = document.querySelector( '.js-humberger' ); // js-hamburger の要素を取得し、変数 humberger に格納する
const nav = document.querySelector( 'js-nav' ); // js-nav の要素を取得し、変数 nav に格納する

humberger.addEventListener( 'click', () => { // ハンバーガーメニューをクリックしたら
	humberger.classList.toggle( 'is-open' ) // p-button に is-open を付け外しする
	nav.classList.toggle( 'is-active' ) // p-list に is-active を付け外しする
} );


