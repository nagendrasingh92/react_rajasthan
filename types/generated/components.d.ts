import type { Schema, Struct } from '@strapi/strapi';

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSection1 extends Struct.ComponentSchema {
  collectionName: 'components_shared_section1s';
  info: {
    displayName: 'section1';
  };
  attributes: {
    imgUrl: Schema.Attribute.Text;
    name: Schema.Attribute.Text;
    role: Schema.Attribute.Text;
  };
}

export interface SharedSection2 extends Struct.ComponentSchema {
  collectionName: 'components_shared_section2s';
  info: {
    displayName: 'section2';
  };
  attributes: {
    bio: Schema.Attribute.Text;
    skills: Schema.Attribute.Text;
  };
}

export interface SharedSection3 extends Struct.ComponentSchema {
  collectionName: 'components_shared_section3s';
  info: {
    displayName: 'section3';
  };
  attributes: {
    projects: Schema.Attribute.Text;
    socialLinks: Schema.Attribute.Component<'shared.social-links', true>;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedSocialLinks extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    displayName: 'socialLinks';
  };
  attributes: {
    type: Schema.Attribute.Enumeration<['linkedin', 'portfolio', 'github']>;
    url: Schema.Attribute.Text;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.section1': SharedSection1;
      'shared.section2': SharedSection2;
      'shared.section3': SharedSection3;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.social-links': SharedSocialLinks;
    }
  }
}
