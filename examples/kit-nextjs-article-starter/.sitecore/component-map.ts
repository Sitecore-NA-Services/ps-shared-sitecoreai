// Below are built-in components that are available in the app, it's recommended to keep them as is
import { NextjsContentSdkComponent } from '@sitecore-content-sdk/nextjs';


import { BYOCServerWrapper, FEaaSServerWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in import section
import * as Widget from 'src/components/widget/Widget';
import * as Widgetprops from 'src/components/widget/widget.props';
import * as Whatsit from 'src/components/whatsit/Whatsit';
import * as VideoPlayerdev from 'src/components/video/VideoPlayer.dev';
import * as VideoModaldev from 'src/components/video/VideoModal.dev';
import * as Video from 'src/components/video/Video';
import * as VideoProps from 'src/components/video/video-props';
import * as VerticalImageAccordion from 'src/components/vertical-image-accordion/VerticalImageAccordion';
import * as VerticalImageAccordionprops from 'src/components/vertical-image-accordion/vertical-image-accordion.props';
import * as HtmlLang from 'src/components/util/HtmlLang';
import * as ChatMarkdown from 'src/components/util/ChatMarkdown';
import * as TopicListing from 'src/components/topic-listing/TopicListing';
import * as TopicItemdev from 'src/components/topic-listing/TopicItem.dev';
import * as TopicListingprops from 'src/components/topic-listing/topic-listing.props';
import * as ThemeProviderdev from 'src/components/theme-provider/theme-provider.dev';
import * as TextBannerDefaultdev from 'src/components/text-banner/TextBannerDefault.dev';
import * as TextBanner02dev from 'src/components/text-banner/TextBanner02.dev';
import * as TextBanner01dev from 'src/components/text-banner/TextBanner01.dev';
import * as TextBanner from 'src/components/text-banner/TextBanner';
import * as TextBannerprops from 'src/components/text-banner/text-banner.props';
import * as TestimonialCarouselItem from 'src/components/testimonial-carousel/TestimonialCarouselItem';
import * as TestimonialCarousel from 'src/components/testimonial-carousel/TestimonialCarousel';
import * as TestimonialCarouselprops from 'src/components/testimonial-carousel/testimonial-carousel.props';
import * as Title from 'src/components/sxa/Title';
import * as RowSplitter from 'src/components/sxa/RowSplitter';
import * as RichText from 'src/components/sxa/RichText';
import * as Promo from 'src/components/sxa/Promo';
import * as PartialDesignDynamicPlaceholder from 'src/components/sxa/PartialDesignDynamicPlaceholder';
import * as PageContent from 'src/components/sxa/PageContent';
import * as Navigation from 'src/components/sxa/Navigation';
import * as LinkList from 'src/components/sxa/LinkList';
import * as Image from 'src/components/sxa/Image';
import * as ContentBlock from 'src/components/sxa/ContentBlock';
import * as Container from 'src/components/sxa/Container';
import * as ColumnSplitter from 'src/components/sxa/ColumnSplitter';
import * as SubscriptionBanner from 'src/components/subscription-banner/SubscriptionBanner';
import * as SubscriptionBannerprops from 'src/components/subscription-banner/subscription-banner.props';
import * as SubscriptionBannerdictionary from 'src/components/subscription-banner/subscription-banner.dictionary';
import * as SearchResults from 'src/components/sitecore-search/SearchResults';
import * as SearchQuestions from 'src/components/sitecore-search/SearchQuestions';
import * as SearchResultsdictionary from 'src/components/sitecore-search/search-results.dictionary';
import * as SearchQuestionsdictionary from 'src/components/sitecore-search/search-questions.dictionary';
import * as SearchConfig from 'src/components/sitecore-search/search-config';
import * as PreviewSearchBox from 'src/components/sitecore-search/PreviewSearchBox';
import * as PreviewSearchdictionary from 'src/components/sitecore-search/preview-search.dictionary';
import * as SiteMetadata from 'src/components/site-metadata/SiteMetadata';
import * as SiteMetadataprops from 'src/components/site-metadata/site-metadata.props';
import * as SecondaryNavigation from 'src/components/secondary-navigation/SecondaryNavigation';
import * as SecondaryNavigationprops from 'src/components/secondary-navigation/secondary-navigation.props';
import * as SearchExperienceLoadMore from 'src/components/search-experience/SearchExperience.LoadMore';
import * as SearchExperience from 'src/components/search-experience/SearchExperience';
import * as UseSearchField from 'src/components/search-experience/search-components/useSearchField';
import * as UseRouter from 'src/components/search-experience/search-components/useRouter';
import * as UseParams from 'src/components/search-experience/search-components/useParams';
import * as UseEvent from 'src/components/search-experience/search-components/useEvent';
import * as UseDebounce from 'src/components/search-experience/search-components/useDebounce';
import * as SearchSkeletonItem from 'src/components/search-experience/search-components/SearchSkeletonItem';
import * as SearchPagination from 'src/components/search-experience/search-components/SearchPagination';
import * as SearchItemCommon from 'src/components/search-experience/search-components/SearchItemCommon';
import * as SearchInput from 'src/components/search-experience/search-components/SearchInput';
import * as SearchError from 'src/components/search-experience/search-components/SearchError';
import * as SearchEmptyResults from 'src/components/search-experience/search-components/SearchEmptyResults';
import * as Models from 'src/components/search-experience/search-components/models';
import * as Constants from 'src/components/search-experience/search-components/constants';
import * as SearchItemTitle from 'src/components/search-experience/search-components/SearchItem/SearchItemTitle';
import * as SearchItemTags from 'src/components/search-experience/search-components/SearchItem/SearchItemTags';
import * as SearchItemSummary from 'src/components/search-experience/search-components/SearchItem/SearchItemSummary';
import * as SearchItemSubTitle from 'src/components/search-experience/search-components/SearchItem/SearchItemSubTitle';
import * as SearchItemLink from 'src/components/search-experience/search-components/SearchItem/SearchItemLink';
import * as SearchItemImage from 'src/components/search-experience/search-components/SearchItem/SearchItemImage';
import * as SearchItemCategory from 'src/components/search-experience/search-components/SearchItem/SearchItemCategory';
import * as Index from 'src/components/search-experience/search-components/SearchItem/index';
import * as RichTextBlock from 'src/components/rich-text-block/RichTextBlock';
import * as RichTextBlockprops from 'src/components/rich-text-block/rich-text-block.props';
import * as RagChat from 'src/components/rag-chat/RagChat';
import * as PromoBlock from 'src/components/promo-block/PromoBlock';
import * as PromoBlockprops from 'src/components/promo-block/promo-block.props';
import * as PromoAnimatedImageRightdev from 'src/components/promo-animated/PromoAnimatedImageRight.dev';
import * as PromoAnimatedDefaultdev from 'src/components/promo-animated/PromoAnimatedDefault.dev';
import * as PromoAnimated from 'src/components/promo-animated/PromoAnimated';
import * as PromoAnimatedutil from 'src/components/promo-animated/promo-animated.util';
import * as PromoAnimatedprops from 'src/components/promo-animated/promo-animated.props';
import * as Portaldev from 'src/components/portal/portal.dev';
import * as PageHeader from 'src/components/page-header/PageHeader';
import * as PageHeaderprops from 'src/components/page-header/page-header.props';
import * as MultiPromoTabs from 'src/components/multi-promo-tabs/MultiPromoTabs';
import * as MultiPromoTabdev from 'src/components/multi-promo-tabs/MultiPromoTab.dev';
import * as MultiPromoTabsprops from 'src/components/multi-promo-tabs/multi-promo-tabs.props';
import * as MultiPromoItemdev from 'src/components/multi-promo/MultiPromoItem.dev';
import * as MultiPromo from 'src/components/multi-promo/MultiPromo';
import * as MultiPromoprops from 'src/components/multi-promo/multi-promo.props';
import * as ModeToggledev from 'src/components/mode-toggle/mode-toggle.dev';
import * as MediaSectiondev from 'src/components/media-section/MediaSection.dev';
import * as MediaSectionprops from 'src/components/media-section/media-section.props';
import * as Meteors from 'src/components/magicui/meteors';
import * as LogoTabs from 'src/components/logo-tabs/LogoTabs';
import * as LogoItem from 'src/components/logo-tabs/LogoItem';
import * as LogoTabsprops from 'src/components/logo-tabs/logo-tabs.props';
import * as Logoprops from 'src/components/logo/logo.props';
import * as Logodev from 'src/components/logo/Logo.dev';
import * as NextImageSrcdev from 'src/components/image/nextImageSrc.dev';
import * as ImageWrapperdev from 'src/components/image/ImageWrapper.dev';
import * as ImageBlock from 'src/components/image/ImageBlock';
import * as Imageprops from 'src/components/image/image.props';
import * as ImageOptimizationcontext from 'src/components/image/image-optimization.context';
import * as Icon from 'src/components/icon/Icon';
import * as YoutubeIcondev from 'src/components/icon/svg/YoutubeIcon.dev';
import * as TwitterIcondev from 'src/components/icon/svg/TwitterIcon.dev';
import * as Signaldev from 'src/components/icon/svg/signal.dev';
import * as Playdev from 'src/components/icon/svg/play.dev';
import * as LinkedInIcondev from 'src/components/icon/svg/LinkedInIcon.dev';
import * as InternalIcondev from 'src/components/icon/svg/InternalIcon.dev';
import * as InstagramIcondev from 'src/components/icon/svg/InstagramIcon.dev';
import * as FileIcondev from 'src/components/icon/svg/FileIcon.dev';
import * as FacebookIcondev from 'src/components/icon/svg/FacebookIcon.dev';
import * as ExternalIcondev from 'src/components/icon/svg/ExternalIcon.dev';
import * as EmailIcondev from 'src/components/icon/svg/EmailIcon.dev';
import * as Diversitydev from 'src/components/icon/svg/diversity.dev';
import * as CrossArrowsdev from 'src/components/icon/svg/cross-arrows.dev';
import * as Communitiesdev from 'src/components/icon/svg/communities.dev';
import * as ArrowUpRightdev from 'src/components/icon/svg/arrow-up-right.dev';
import * as ArrowRightdev from 'src/components/icon/svg/arrow-right.dev';
import * as ArrowLeftdev from 'src/components/icon/svg/arrow-left.dev';
import * as Hero from 'src/components/hero/Hero';
import * as Heroprops from 'src/components/hero/hero.props';
import * as GlobalHeader from 'src/components/global-header/GlobalHeader';
import * as GlobalHeaderprops from 'src/components/global-header/global-header.props';
import * as GlobalFooter from 'src/components/global-footer/GlobalFooter';
import * as GlobalFooterprops from 'src/components/global-footer/global-footer.props';
import * as FooterNavigationColumn from 'src/components/global-footer/FooterNavigationColumn';
import * as FooterNavigationCalloutdev from 'src/components/footer-navigation-callout/FooterNavigationCallout.dev';
import * as FloatingDockdev from 'src/components/floating-dock/floating-dock.dev';
import * as Flexdev from 'src/components/flex/Flex.dev';
import * as CtaBanner from 'src/components/cta-banner/CtaBanner';
import * as Containerutil from 'src/components/container/container.util';
import * as ContainerFullWidth from 'src/components/container/container-full-width/ContainerFullWidth';
import * as ContainerFullBleed from 'src/components/container/container-full-bleed/ContainerFullBleed';
import * as Container7030 from 'src/components/container/container-7030/Container7030';
import * as Container70 from 'src/components/container/container-70/Container70';
import * as Container6321 from 'src/components/container/container-6321/Container6321';
import * as Container6040 from 'src/components/container/container-6040/Container6040';
import * as Container5050 from 'src/components/container/container-5050/Container5050';
import * as Container4060 from 'src/components/container/container-4060/Container4060';
import * as Container3070 from 'src/components/container/container-3070/Container3070';
import * as Container303030 from 'src/components/container/container-303030/Container303030';
import * as Container25252525 from 'src/components/container/container-25252525/Container25252525';
import * as Carddev from 'src/components/card/Card.dev';
import * as ButtonComponent from 'src/components/button-component/ButtonComponent';
import * as Breadcrumbs from 'src/components/breadcrumbs/Breadcrumbs';
import * as BackgroundThumbnaildev from 'src/components/background-thumbnail/BackgroundThumbnail.dev';
import * as ArticleListing from 'src/components/article-listing/ArticleListing';
import * as ArticleHeader from 'src/components/article-header/ArticleHeader';
import * as ArticleHeaderdictionary from 'src/components/article-header/article-header.dictionary';
import * as ArticleFullprops from 'src/components/article-full/ArticleFull.props';
import * as ArticleFull from 'src/components/article-full/ArticleFull';
import * as AnimatedSectiondev from 'src/components/animated-section/AnimatedSection.dev';
import * as AlertBannerdev from 'src/components/alert-banner/AlertBanner.dev';
import * as AgentChat from 'src/components/agent-chat/AgentChat';
import * as AccordionBlockItemdev from 'src/components/accordion-block/AccordionBlockItem.dev';
import * as AccordionBlockDefaultdev from 'src/components/accordion-block/AccordionBlockDefault.dev';
import * as AccordionBlock from 'src/components/accordion-block/AccordionBlock';
import * as AccordionBlockprops from 'src/components/accordion-block/accordion-block.props';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['Widget', { ...Widget }],
  ['widget', { ...Widgetprops }],
  ['Whatsit', { ...Whatsit }],
  ['VideoPlayer', { ...VideoPlayerdev }],
  ['VideoModal', { ...VideoModaldev }],
  ['Video', { ...Video, componentType: 'client' }],
  ['video-props', { ...VideoProps }],
  ['VerticalImageAccordion', { ...VerticalImageAccordion, componentType: 'client' }],
  ['vertical-image-accordion', { ...VerticalImageAccordionprops }],
  ['HtmlLang', { ...HtmlLang, componentType: 'client' }],
  ['ChatMarkdown', { ...ChatMarkdown, componentType: 'client' }],
  ['TopicListing', { ...TopicListing }],
  ['TopicItem', { ...TopicItemdev }],
  ['topic-listing', { ...TopicListingprops }],
  ['theme-provider', { ...ThemeProviderdev }],
  ['TextBannerDefault', { ...TextBannerDefaultdev }],
  ['TextBanner02', { ...TextBanner02dev }],
  ['TextBanner01', { ...TextBanner01dev }],
  ['TextBanner', { ...TextBanner }],
  ['text-banner', { ...TextBannerprops }],
  ['TestimonialCarouselItem', { ...TestimonialCarouselItem }],
  ['TestimonialCarousel', { ...TestimonialCarousel, componentType: 'client' }],
  ['testimonial-carousel', { ...TestimonialCarouselprops }],
  ['Title', { ...Title, componentType: 'client' }],
  ['RowSplitter', { ...RowSplitter }],
  ['RichText', { ...RichText }],
  ['Promo', { ...Promo }],
  ['PartialDesignDynamicPlaceholder', { ...PartialDesignDynamicPlaceholder }],
  ['PageContent', { ...PageContent, componentType: 'client' }],
  ['Navigation', { ...Navigation, componentType: 'client' }],
  ['LinkList', { ...LinkList }],
  ['Image', { ...Image, componentType: 'client' }],
  ['ContentBlock', { ...ContentBlock }],
  ['Container', { ...Container }],
  ['ColumnSplitter', { ...ColumnSplitter }],
  ['SubscriptionBanner', { ...SubscriptionBanner, componentType: 'client' }],
  ['subscription-banner', { ...SubscriptionBannerprops, ...SubscriptionBannerdictionary }],
  ['SearchResults', { ...SearchResults, componentType: 'client' }],
  ['SearchQuestions', { ...SearchQuestions, componentType: 'client' }],
  ['search-results', { ...SearchResultsdictionary }],
  ['search-questions', { ...SearchQuestionsdictionary }],
  ['search-config', { ...SearchConfig }],
  ['PreviewSearchBox', { ...PreviewSearchBox, componentType: 'client' }],
  ['preview-search', { ...PreviewSearchdictionary }],
  ['SiteMetadata', { ...SiteMetadata }],
  ['site-metadata', { ...SiteMetadataprops }],
  ['SecondaryNavigation', { ...SecondaryNavigation, componentType: 'client' }],
  ['secondary-navigation', { ...SecondaryNavigationprops }],
  ['SearchExperience', { ...SearchExperienceLoadMore, ...SearchExperience, componentType: 'client' }],
  ['useSearchField', { ...UseSearchField, componentType: 'client' }],
  ['useRouter', { ...UseRouter, componentType: 'client' }],
  ['useParams', { ...UseParams, componentType: 'client' }],
  ['useEvent', { ...UseEvent, componentType: 'client' }],
  ['useDebounce', { ...UseDebounce, componentType: 'client' }],
  ['SearchSkeletonItem', { ...SearchSkeletonItem, componentType: 'client' }],
  ['SearchPagination', { ...SearchPagination, componentType: 'client' }],
  ['SearchItemCommon', { ...SearchItemCommon, componentType: 'client' }],
  ['SearchInput', { ...SearchInput, componentType: 'client' }],
  ['SearchError', { ...SearchError, componentType: 'client' }],
  ['SearchEmptyResults', { ...SearchEmptyResults, componentType: 'client' }],
  ['models', { ...Models }],
  ['constants', { ...Constants }],
  ['SearchItemTitle', { ...SearchItemTitle, componentType: 'client' }],
  ['SearchItemTags', { ...SearchItemTags, componentType: 'client' }],
  ['SearchItemSummary', { ...SearchItemSummary, componentType: 'client' }],
  ['SearchItemSubTitle', { ...SearchItemSubTitle, componentType: 'client' }],
  ['SearchItemLink', { ...SearchItemLink, componentType: 'client' }],
  ['SearchItemImage', { ...SearchItemImage, componentType: 'client' }],
  ['SearchItemCategory', { ...SearchItemCategory, componentType: 'client' }],
  ['index', { ...Index, componentType: 'client' }],
  ['RichTextBlock', { ...RichTextBlock }],
  ['rich-text-block', { ...RichTextBlockprops }],
  ['RagChat', { ...RagChat, componentType: 'client' }],
  ['PromoBlock', { ...PromoBlock }],
  ['promo-block', { ...PromoBlockprops }],
  ['PromoAnimatedImageRight', { ...PromoAnimatedImageRightdev }],
  ['PromoAnimatedDefault', { ...PromoAnimatedDefaultdev }],
  ['PromoAnimated', { ...PromoAnimated, componentType: 'client' }],
  ['promo-animated', { ...PromoAnimatedutil, ...PromoAnimatedprops }],
  ['portal', { ...Portaldev }],
  ['PageHeader', { ...PageHeader, componentType: 'client' }],
  ['page-header', { ...PageHeaderprops }],
  ['MultiPromoTabs', { ...MultiPromoTabs, componentType: 'client' }],
  ['MultiPromoTab', { ...MultiPromoTabdev }],
  ['multi-promo-tabs', { ...MultiPromoTabsprops }],
  ['MultiPromoItem', { ...MultiPromoItemdev }],
  ['MultiPromo', { ...MultiPromo, componentType: 'client' }],
  ['multi-promo', { ...MultiPromoprops }],
  ['mode-toggle', { ...ModeToggledev }],
  ['MediaSection', { ...MediaSectiondev }],
  ['media-section', { ...MediaSectionprops }],
  ['meteors', { ...Meteors, componentType: 'client' }],
  ['LogoTabs', { ...LogoTabs, componentType: 'client' }],
  ['LogoItem', { ...LogoItem }],
  ['logo-tabs', { ...LogoTabsprops }],
  ['logo', { ...Logoprops }],
  ['Logo', { ...Logodev }],
  ['nextImageSrc', { ...NextImageSrcdev }],
  ['ImageWrapper', { ...ImageWrapperdev }],
  ['ImageBlock', { ...ImageBlock }],
  ['image', { ...Imageprops }],
  ['image-optimization', { ...ImageOptimizationcontext }],
  ['Icon', { ...Icon, componentType: 'client' }],
  ['YoutubeIcon', { ...YoutubeIcondev }],
  ['TwitterIcon', { ...TwitterIcondev }],
  ['signal', { ...Signaldev }],
  ['play', { ...Playdev }],
  ['LinkedInIcon', { ...LinkedInIcondev }],
  ['InternalIcon', { ...InternalIcondev }],
  ['InstagramIcon', { ...InstagramIcondev }],
  ['FileIcon', { ...FileIcondev }],
  ['FacebookIcon', { ...FacebookIcondev }],
  ['ExternalIcon', { ...ExternalIcondev }],
  ['EmailIcon', { ...EmailIcondev }],
  ['diversity', { ...Diversitydev }],
  ['cross-arrows', { ...CrossArrowsdev }],
  ['communities', { ...Communitiesdev }],
  ['arrow-up-right', { ...ArrowUpRightdev }],
  ['arrow-right', { ...ArrowRightdev }],
  ['arrow-left', { ...ArrowLeftdev }],
  ['Hero', { ...Hero, componentType: 'client' }],
  ['hero', { ...Heroprops }],
  ['GlobalHeader', { ...GlobalHeader, componentType: 'client' }],
  ['global-header', { ...GlobalHeaderprops }],
  ['GlobalFooter', { ...GlobalFooter }],
  ['global-footer', { ...GlobalFooterprops }],
  ['FooterNavigationColumn', { ...FooterNavigationColumn, componentType: 'client' }],
  ['FooterNavigationCallout', { ...FooterNavigationCalloutdev }],
  ['floating-dock', { ...FloatingDockdev }],
  ['Flex', { ...Flexdev }],
  ['CtaBanner', { ...CtaBanner }],
  ['container', { ...Containerutil }],
  ['ContainerFullWidth', { ...ContainerFullWidth }],
  ['ContainerFullBleed', { ...ContainerFullBleed }],
  ['Container7030', { ...Container7030 }],
  ['Container70', { ...Container70 }],
  ['Container6321', { ...Container6321 }],
  ['Container6040', { ...Container6040 }],
  ['Container5050', { ...Container5050 }],
  ['Container4060', { ...Container4060 }],
  ['Container3070', { ...Container3070 }],
  ['Container303030', { ...Container303030 }],
  ['Container25252525', { ...Container25252525 }],
  ['Card', { ...Carddev }],
  ['ButtonComponent', { ...ButtonComponent }],
  ['Breadcrumbs', { ...Breadcrumbs }],
  ['BackgroundThumbnail', { ...BackgroundThumbnaildev }],
  ['ArticleListing', { ...ArticleListing, componentType: 'client' }],
  ['ArticleHeader', { ...ArticleHeader, componentType: 'client' }],
  ['article-header', { ...ArticleHeaderdictionary }],
  ['ArticleFull', { ...ArticleFullprops, ...ArticleFull, componentType: 'client' }],
  ['AnimatedSection', { ...AnimatedSectiondev }],
  ['AlertBanner', { ...AlertBannerdev }],
  ['AgentChat', { ...AgentChat, componentType: 'client' }],
  ['AccordionBlockItem', { ...AccordionBlockItemdev }],
  ['AccordionBlockDefault', { ...AccordionBlockDefaultdev }],
  ['AccordionBlock', { ...AccordionBlock, componentType: 'client' }],
  ['accordion-block', { ...AccordionBlockprops }],
]);

export default componentMap;
