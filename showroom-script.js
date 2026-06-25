/*
|--------------------------------------------------------------------------
| Showroom Script
|--------------------------------------------------------------------------
|
| This script applies showroom-specific customizations based on the
| current showroom URL (window.location.pathname).
|
|--------------------------------------------------------------------------
| Adding a New Showroom
|--------------------------------------------------------------------------
|
| Each showroom must be registered using its showroom URL.
|
| Example:
|
| '/showroom-marine/current/MyBrand/Boat/': {
|   ...
| }
|
| The URL must match:
|
| window.location.pathname
|
| Example:
|
| URL:
| https://www.example.com/showroom-marine/current/MyBrand/Boat/
|
| Pathname:
| /showroom-marine/current/MyBrand/Boat/
|
|--------------------------------------------------------------------------
| Configuration Options
|--------------------------------------------------------------------------
|
| hide
| ----
| Removes a model from the showroom.
| Can be combined with other options.
|
| Example:
|
| 'DVX20': {
|   hide: true
| }
|
|--------------------------------------------------------------------------
|
| urlImage
| --------
| Replaces the showroom image for a model.
| Can be combined with other options.
|
| Example:
|
| 'VXs21': {
|   urlImage: '/wp-content/uploads/2026/06/VXs21.webp'
| }
|
|--------------------------------------------------------------------------
|
| category
| --------
| Assigns a model to a category.
| Can be combined with other options.
|
| The category must exist in "newCategory".
|
| Example:
|
| 'VXs21': {
|   category: 'Fiberglass'
| }
|
|--------------------------------------------------------------------------
|
| newCategory
| -----------
| Creates custom categories inside the showroom.
|
| Example:
|
| newCategory: [
|   'Aluminum',
|   'Fiberglass'
| ]
|
|--------------------------------------------------------------------------
|
| appendShowrooms
| ---------------
| Appends models from another showroom into the current showroom.
|
| Example:
|
| appendShowrooms: [
|   '/showroom-marine/current/Yar-Craft/Boat/'
| ]
|
|--------------------------------------------------------------------------
| Combining Options
|--------------------------------------------------------------------------
|
| Multiple options can be used together within the same model
| configuration.
|
| Example:
|
| 'VXs21': {
|   urlImage: '/wp-content/uploads/VXs21.webp',
|   category: 'Fiberglass'
| }
|
| Example:
|
| 'My Model': {
|   hide: true,
|   category: 'Aluminum'
| }
|
| Do NOT create multiple entries for the same model.
|
| Incorrect:
|
| 'VXs21': {
|   urlImage: '/image.webp'
| },
|
| 'VXs21': {
|   category: 'Fiberglass'
| }
|
| The second entry will overwrite the first one.
|
|--------------------------------------------------------------------------
| Example Configuration
|--------------------------------------------------------------------------
|
| '/showroom-marine/current/MyBrand/Boat/': {
|
|   newCategory: [
|     'Aluminum',
|     'Fiberglass'
|   ],
|
|   appendShowrooms: [
|     '/showroom-marine/current/AnotherBrand/Boat/'
|   ],
|
|   'Model Name': {
|     category: 'Aluminum',
|     urlImage: '/wp-content/uploads/image.webp'
|   },
|
|   'Hidden Model': {
|     hide: true
|   }
| }
|
|--------------------------------------------------------------------------
| How It Works
|--------------------------------------------------------------------------
|
| 1. Append additional showrooms
| 2. Create configured categories
| 3. Process model configurations
| 4. Remove empty categories
| 5. Remove showroom titles
| 6. Clean page titles
| 7. Apply dealer-specific customizations
|
|--------------------------------------------------------------------------
| Dealer-Specific Customizations
|--------------------------------------------------------------------------
|
| Use applyDealerSpecificChanges()
|
| for custom logic that cannot be handled through configuration.
|
| Examples:
|
| - Rename category labels
| - Move custom elements
| - Apply dealer-only UI changes
| - Special showroom behavior
|
*/

const ShowroomCustomizer = {
  async init(config) {
    this.config = config;

    const pathname = window.location.pathname;
    const showroomConfig = config.showrooms[pathname];

    if (!showroomConfig) return;

    const showroomContainer = jQuery('#inventory-showroom');
    const titleRules = [
      ...(this.config.cleanTitleRules || []),
      ...(this.showroomConfig.cleanTitleRules || []),
    ];

    await this.appendShowrooms(showroomConfig, showroomContainer);
    this.createCategories(showroomConfig, showroomContainer);
    this.processModels(showroomConfig);
    this.removeEmptyCategories();
    this.removeShowroomTitles(pathname);
    this.cleanPageTitles(titleRules);

    if (typeof config.afterInit === 'function') {
      config.afterInit();
    }
  },

  async appendShowrooms(showroomConfig, showroomContainer) {
    const showrooms = showroomConfig.appendShowrooms || [];

    for (const url of showrooms) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          console.error(`Failed to load showroom: ${url}`);
          continue;
        }

        const html = await response.text();

        showroomContainer.append(
          jQuery(html).find('.showroom-container').first()
        );
      } catch (error) {
        console.error('Error appending showroom:', url, error);
      }
    }
  },

  createCategories(showroomConfig, showroomContainer) {
    const categories = showroomConfig.newCategory || [];

    const firstShowroom = showroomContainer.find('.showroom-container').first();

    categories.forEach((category) => {
      firstShowroom.append(`
      <div style="padding:20px 0;">
        <h3 style="text-align:left;">${category}</h3>
      </div>
      <div style="clear:both;"></div>
    `);
    });
  },

  processModels(showroomConfig) {
    jQuery('.showroom-container .showroom-item').each((_, element) => {
      const modelName = this.getModelName(element);
      const modelConfig = showroomConfig.models[modelName];

      if (!modelConfig) return;

      this.applyModelConfiguration(element, modelConfig);
    });
  },

  getModelName(element) {
    return jQuery(element).find('.makename p').text().trim();
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

  cleanPageTitles(titleRules) {
    jQuery('.showroom-container h1').each((_, element) => {
      const title = jQuery(element).text().trim();

      // jQuery(element).text(
      //   title
      //     .replace(/\s*\/\s*Boat$/i, '')
      //     .replace(/\s*Bass Boats$/i, '')
      //     .trim()
      // );

      titleRules.forEach((rule) => {
        title = title.replace(rule, '');
      });

      jQuery(element).text(title);
    });
  },
};

// ShowroomCustomizer.init({
//   cleanTitleRules: [/\s*\/\s*Boat$/i],
//   showrooms: {
//     '/showroom-marine/current/Phoenix%20Bass%20Boats/Boat/': {
//       models: {
//         '20XE': {
//           urlImage: '/wp-content/uploads/2026/06/20XE.webp',
//         },
//         '21XE': {
//           urlImage: '/wp-content/uploads/2026/06/21XE.webp',
//         },
//         '721ZXL': {
//           urlImage: '/wp-content/uploads/2026/06/721ZXL.webp',
//         },
//         '818Pro': {
//           urlImage: '/wp-content/uploads/2026/06/818Pro.webp',
//         },
//         '819ZXL': {
//           urlImage: '/wp-content/uploads/2026/06/819ZXL.webp',
//         },
//         '919ZXL': {
//           urlImage: '/wp-content/uploads/2026/06/919ZXL.webp',
//         },
//         '920Elite X': {
//           urlImage: '/wp-content/uploads/2026/06/920Elite-X.webp',
//         },
//         '920Elite X II': {
//           urlImage: '/wp-content/uploads/2026/06/920Elite-X-II.webp',
//         },
//         '921Elite X': {
//           urlImage: '/wp-content/uploads/2026/06/921Elite-X.webp',
//         },
//         '921Elite X II': {
//           urlImage: '/wp-content/uploads/2026/06/921Elite-X-II.webp',
//         },
//       },
//     },
//     '/showroom-marine/current/Vexus/Boat/': {
//       cleanTitleRules: [/\s*Bass Boats$/i],
//       newCategory: ['Aluminum', 'Fiberglass'],
//       models: {
//         VXs21: {
//           urlImage: '/wp-content/uploads/2026/06/VXs21.webp',
//           category: 'Fiberglass',
//         },
//         VXs20: {
//           urlImage: '/wp-content/uploads/2026/06/VXs20.webp',
//           category: 'Fiberglass',
//         },
//         DVX23s: {
//           urlImage: '/wp-content/uploads/2026/06/DVX23s.webp',
//           category: 'Fiberglass',
//         },
//         DVX22s: {
//           urlImage: '/wp-content/uploads/2026/06/DVX22s.webp',
//           category: 'Fiberglass',
//         },
//         'DVX20 XPro': {
//           urlImage: '/wp-content/uploads/2026/06/DVX20-XPro.webp',
//           category: 'Fiberglass',
//         },
//         'Defender 201': {
//           urlImage: '/wp-content/uploads/2026/06/Defender-201.webp',
//           category: 'Aluminum',
//         },
//         'Defender 189': {
//           urlImage: '/wp-content/uploads/2026/06/Defender-189.webp',
//           category: 'Aluminum',
//         },
//         'Defender 181': {
//           urlImage: '/wp-content/uploads/2026/06/Defender-181.webp',
//           category: 'Aluminum',
//         },
//         ADX180HS: {
//           urlImage: '/wp-content/uploads/2026/06/ADX180HS.webp',
//           category: 'Aluminum',
//         },
//         ACX2210: {
//           urlImage: '/wp-content/uploads/2026/06/ACX2210.webp',
//           category: 'Aluminum',
//         },
//         ACX2150: {
//           urlImage: '/wp-content/uploads/2026/06/ACX2150.webp',
//           category: 'Aluminum',
//         },
//         ACX2000: {
//           urlImage: '/wp-content/uploads/2026/06/VXs21.webp',
//           category: 'Aluminum',
//         },
//         AVX2085s: {
//           urlImage: '/wp-content/uploads/2026/06/AVX2085s.webp',
//           category: 'Aluminum',
//         },
//         AVX1985s: {
//           urlImage: '/wp-content/uploads/2026/06/AVX1985s.webp',
//           category: 'Aluminum',
//         },
//         'AVX 2100': {
//           urlImage: '/wp-content/uploads/2026/06/AVX-2100.webp',
//           category: 'Aluminum',
//         },
//         'AVX 1880': {
//           category: 'Aluminum',
//         },
//         'AVX 1880c': {
//           category: 'Aluminum',
//         },
//         'AVX 2080': {
//           category: 'Aluminum',
//         },
//         ADX190: {
//           category: 'Aluminum',
//         },
//         AVX1980c: {
//           category: 'Aluminum',
//         },
//         'AVX 1980': {
//           urlImage: '/wp-content/uploads/2026/06/AVX-1980.webp',
//           category: 'Aluminum',
//         },
//         ADX202: {
//           urlImage: '/wp-content/uploads/2026/06/ADX202.webp',
//           category: 'Aluminum',
//         },
//         ADX200: {
//           urlImage: '/wp-content/uploads/2026/06/ADX200.webp',
//           category: 'Aluminum',
//         },
//         ADX180LS: {
//           urlImage: '/wp-content/uploads/2026/06/ADX180LS.webp',
//           category: 'Aluminum',
//         },
//         DVX20: { hide: true },
//         DVX20s: { hide: true },
//         DVX22: { hide: true },
//       },
//     },
//     '/showroom-marine/current/BassCat/Boat/': {
//       appendShowrooms: ['/showroom-marine/current/Yar-Craft/Boat/'],
//       models: {
//         '186 TFX': { hide: true },
//         '209 TFX': { hide: true },
//         '2095 BTX': { hide: true },
//       },
//     },
//     '/showroom-marine/current/G3/Boat/': {
//       models: {
//         'Guide V14 LT': {
//           category: 'Jon',
//         },
//         'Guide V16 XT': {
//           category: 'Jon',
//         },
//         'OF V187 T': {
//           category: 'Jon',
//         },
//         'V167 T': {
//           category: 'Jon',
//         },
//         'Sportsman 1710 SE': {
//           category: 'Fishing',
//         },
//         'Sportsman 1810 SE': {
//           category: 'Fishing',
//         },
//         'Sportsman 1910 SE': {
//           category: 'Fishing',
//         },
//         'Bay 19 GX': {
//           category: 'Center Console',
//         },
//         'Bay 19 GX Tunnel': {
//           category: 'Center Console',
//         },
//         'Bay 21 GX': {
//           category: 'Center Console',
//         },
//         'Bay 21 GX Tunnel': {
//           category: 'Center Console',
//         },
//         '18 SC': {
//           category: 'Jon',
//         },
//         '20 SC': {
//           category: 'Jon',
//         },
//       },
//       cleanTitleRules: [],
//     },
//   },
//   afterInit() {
//     switch (window.location.pathname) {
//       case '/showroom-marine/current/G3/Boat/':
//         jQuery('.showroom-container h3')
//           .filter((_, element) => jQuery(element).text().trim() === 'Fishing')
//           .first()
//           .text('Sportsman');
//         break;
//     }
//   },
// });
