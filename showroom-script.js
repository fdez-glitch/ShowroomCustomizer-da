const ShowroomCustomizer = {
  // ==========================================
  // Initialization
  // ==========================================

  async init(config) {
    this.config = config;
    this.initializeObserver();

    const pathname = window.location.pathname;
    const showroomConfig = config.showrooms[pathname];

    if (!showroomConfig) return;

    this.showroomContainer = jQuery('#inventory-showroom');

    await this.prepareShowroom(showroomConfig, pathname);

    this.observeImages(this.showroomContainer);

    config.afterInit?.();
  },

  initializeObserver() {
    this.observer = new IntersectionObserver(this.onIntersection.bind(this), {
      rootMargin: '300px 0px',
      threshold: 0.01,
    });
  },

  onIntersection(entries) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const item = entry.target;

      item.style.backgroundImage = item.dataset.bg;

      delete item.dataset.bg;

      this.observer.unobserve(item);
    });
  },

  async prepareShowroom(showroomConfig, pathname, titleRules) {
    const titleRules = [
      ...(this.config.cleanTitleRules || []),
      ...(showroomConfig.cleanTitleRules || []),
    ];

    await this.appendShowrooms(showroomConfig);
    this.removeCategories(showroomConfig);
    this.createCategories(showroomConfig);
    this.processModels(showroomConfig);
    this.removeEmptyCategories();
    this.removeShowroomTitles(pathname);
    this.cleanPageTitles(titleRules);
  },

  observeImages() {
    this.showroomContainer
      .find('.showroom-item')
      .each((_, e) => this.observeBackgroundImage(e));
  },

  // ==========================================
  // Utilities
  // ==========================================

  safeArray(v) {
    return Array.isArray(v) ? v : [];
  },
  getModelName(element) {
    return jQuery(element).find('.makename p').text().trim();
  },

  // ==========================================
  // Loading
  // ==========================================

  async appendShowrooms(showroomConfig) {
    const showrooms = showroomConfig.appendShowrooms || [];
    const newShowrooms = [];

    for (const url of showrooms) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          console.error(`Failed to load showroom: ${url}`);
          continue;
        }

        const html = jQuery(await response.text());

        html.find('.showroom-item').each((_, element) => {
          const bg = element.style.backgroundImage;

          if (!bg || bg === 'none') return;
          element.dataset.bg = bg;
          element.style.backgroundImage = '';
        });

        newShowrooms.push(html.find('.showroom-container').first());
      } catch (error) {
        console.error('Error appending showroom:', url, error);
      }
    }

    newShowrooms.forEach((showroom) => {
      this.showroomContainer.append(showroom);
    });
  },
  observeBackgroundImage(element) {
    this.observer.observe(element);
  },

  // ==========================================
  // Categories
  // ==========================================

  createCategories(showroomConfig) {
    const categories = this.safeArray(showroomConfig.newCategory);

    categories.forEach(({ newCategories, brand }) => {
      if (!newCategories || !brand) return;

      const categoryContainer = this.showroomContainer
        .find('h1')
        .filter((_, e) => jQuery(e).text().includes(brand))
        .first()
        .parent();

      newCategories.forEach((category) => {
        categoryContainer.append(`
          <div style="padding:20px 0;">
            <h3 style="text-align:left;">${category}</h3>
          </div>
          <div style="clear:both;"></div>
        `);
      });
    });
  },

  removeCategories(showroomConfig) {
    const categoriesToHide = this.safeArray(showroomConfig.removeCategories);

    categoriesToHide.forEach(({ categories, brand }) => {
      if (!brand || !categories) return;

      const categoryContainer = this.showroomContainer
        .find('h1')
        .filter((_, e) =>
          jQuery(e).text().toLowerCase().includes(brand.toLowerCase())
        )
        .first()
        .parent();

      categories.forEach((subCategory) => {
        const subCategoryContainer = jQuery(categoryContainer)
          .find('h3')
          .filter((_, e) => jQuery(e).text().trim() === subCategory)
          .first()
          .parent();

        subCategoryContainer.remove();
      });
    });
  },

  moveModelToCategory(element, categoryName) {
    const item = jQuery(element).closest('a');

    const destinationCategory = jQuery('.showroom-container h3')
      .filter((_, category) => jQuery(category).text().trim() === categoryName)
      .first()
      .parent();

    if (!destinationCategory.length) {
      console.warn(`Category not found: ${categoryName}`);
      return;
    }

    destinationCategory.append(item);
  },

  removeEmptyCategories() {
    jQuery('.showroom-container > div').each((_, container) => {
      const category = jQuery(container);

      const hasTitle = category.find('h3').length > 0;
      const itemCount = category.find('.showroom-item').length;

      if (hasTitle && itemCount === 0) {
        category.remove();
      }
    });
  },

  removeShowroomTitles(pathname) {
    const showroomsWithoutTitles = [
      '/showroom-marine/current/BassCat/Boat/',
      '/showroom-marine/current/Phoenix%20Bass%20Boats/Boat/',
    ];

    if (!showroomsWithoutTitles.includes(pathname)) return;

    jQuery('.showroom-container h3').remove();

    if (!document.getElementById('showroom-custom-style')) {
      jQuery('body').append(`
      <style id="showroom-custom-style">
        .showroom-container > div {
          display: contents;
        }
      </style>
    `);
    }
  },

  // ==========================================
  // Models
  // ==========================================

  processModels(showroomConfig) {
    const models = showroomConfig.models || {};

    jQuery('.showroom-container .showroom-item').each((_, element) => {
      const modelName = this.getModelName(element);
      const modelConfig = models[modelName];

      if (!modelConfig) return;

      this.applyModelConfiguration(element, modelConfig);
    });
  },

  applyModelConfiguration(element, config) {
    const { hide, urlImage, category } = config;

    if (hide) {
      this.hideModel(element);
      return;
    }

    if (urlImage) {
      this.replaceModelImage(element, urlImage);
    }

    if (category) {
      this.moveModelToCategory(element, category);
    }
  },

  hideModel(element) {
    jQuery(element).closest('a').remove();
  },

  replaceModelImage(element, imageUrl) {
    jQuery(element).css('background-image', `url(${imageUrl})`);
  },

  // ==========================================
  // Titles
  // ==========================================

  cleanPageTitles(titleRules) {
    jQuery('.showroom-container h1').each((_, element) => {
      const title = jQuery(element).text().trim();

      titleRules.forEach((rule) => {
        jQuery(element).text(title.replace(rule, ''));
      });
    });
  },
};
