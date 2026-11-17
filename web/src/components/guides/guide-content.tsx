import type { List, ListItem, Paragraph, PhrasingContent, RootContent, Table } from 'mdast';
import type { TextDirective } from 'mdast-util-directive';
import Link from 'next/link';
import { Claim, Mark } from '@/components/course/marks';
import { PenNumber } from '@/components/site/pen';
import type { Guide } from '@/lib/guides/guides';
import { SourceRef } from './source-ref';

/**
 * גוף המדריך, מעץ ה-Markdown (mdast) ל-React, בשרת. כל עובדה מסומנת לפי המקור שלה, כמו בעמוד הקורס:
 * :verified מרקר ירוק ומספר של מקור, :institution קו כחול של טענה, :site העט הכחול, שהוא הקול של האתר.
 * כל סימון נושא תווית לקורא מסך (DESIGN.md, The Shape Too Rule).
 */

/** קישור בתוך טקסט: קו דק בדיו, כמו בעמוד הקורס. הקו הכחול שמור לטענה של מוסד. */
export const textLink = 'underline decoration-1 underline-offset-[3px] hover:text-link-hover';

function Inline({ node, guide, continues }: { node: PhrasingContent; guide: Guide; continues: boolean }) {
  switch (node.type) {
    case 'text':
      return node.value;
    case 'strong':
      return (
        <strong className="font-bold">
          <Inlines nodes={node.children} guide={guide} />
        </strong>
      );
    case 'emphasis':
      return (
        <em>
          <Inlines nodes={node.children} guide={guide} />
        </em>
      );
    case 'inlineCode':
      return <code className="font-sans">{node.value}</code>;
    case 'break':
      return <br />;
    case 'link':
      return node.url.startsWith('/') ? (
        <Link href={node.url} className={textLink}>
          <Inlines nodes={node.children} guide={guide} />
        </Link>
      ) : (
        <a href={node.url} target="_blank" rel="noopener noreferrer" className={textLink}>
          <Inlines nodes={node.children} guide={guide} />
          <span className="sr-only"> (בחלון חדש)</span>
        </a>
      );
    case 'textDirective':
      return <Directive node={node} guide={guide} continues={continues} />;
    default:
      throw new Error(`guide-content: אין עיצוב ל-${node.type} בתוך שורה`);
  }
}

/**
 * continues: עובדה ירוקה שממשיכה רצף של עובדות ירוקות באותה פסקה, ובינה לבין הקודמת רק רווח (והמספר של המקור).
 * הווי בעט עומד רק בתחילת הרצף: וי בכל משפט באמצע השורה מפריע לקרוא טקסט ארוך (סקירת הסיום, 16.11.2026).
 */
function Inlines({ nodes, guide }: { nodes: PhrasingContent[]; guide: Guide }) {
  let previous: string | null = null;
  return nodes.map((node, i) => {
    const name = node.type === 'textDirective' ? node.name : null;
    const continues = name === 'verified' && previous === 'verified';
    if (!(node.type === 'text' && node.value.trim() === '')) previous = name;
    return <Inline key={i} node={node} guide={guide} continues={continues} />;
  });
}

function Directive({ node, guide, continues }: { node: TextDirective; guide: Guide; continues: boolean }) {
  const children = <Inlines nodes={node.children} guide={guide} />;
  if (node.name === 'verified') {
    const ref = guide.refs[node.data?.guideRef ?? -1];
    return (
      <>
        <Mark source="verified" cue={!continues}>
          {children}
        </Mark>
        {ref && <SourceRef refData={ref} />}
      </>
    );
  }
  if (node.name === 'institution') return <Claim>{children}</Claim>;
  return (
    <span data-source="site" className="font-pen font-medium text-pen">
      <span className="sr-only">הערה של למדתי: </span>
      {children}
    </span>
  );
}

/** פסקה שכולה הערה של האתר: נכתבת בעט כשהיא נכנסת למסך, כמו הערות העט בשאר האתר. */
function isPenParagraph(node: Paragraph): boolean {
  const content = node.children.filter((c) => !(c.type === 'text' && c.value.trim() === ''));
  return content.length === 1 && content[0].type === 'textDirective' && content[0].name === 'site';
}

/** פריט ברשימה: רשימה צפופה (בלי שורה ריקה בין הפריטים) נכתבת בלי פסקה בתוך הפריט. */
function ItemContent({ item, guide }: { item: ListItem; guide: Guide }) {
  const [only] = item.children;
  if (item.children.length === 1 && only.type === 'paragraph') return <Inlines nodes={only.children} guide={guide} />;
  return <Blocks nodes={item.children} guide={guide} />;
}

/**
 * רשימה ממוספרת (הרשימה לשמירה, שלבים): שורות מחברת שנמשכות עד קצה הנייר, והמספר מוקף בעט,
 * כמו השאלות במחברת בדף הבית. סדר אמיתי, ולכן מספרים: "שאלה 5" היא משהו שאפשר להגיד בשיחה עם המוסד.
 */
function NotebookList({ node, guide }: { node: List; guide: Guide }) {
  const start = node.start ?? 1;
  return (
    <ol start={start} className="ruled-top mt-5 lg:mt-6">
      {node.children.map((item, i) => (
        <li key={i} className="ruled-row flex items-start gap-3 py-3 lg:gap-4 lg:py-3.5">
          <PenNumber n={start + i} className="-mt-px" />
          <div className="min-w-0 flex-1 pt-px">
            <ItemContent item={item} guide={guide} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function GuideTable({ node, guide }: { node: Table; guide: Guide }) {
  const [head, ...rows] = node.children;
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full border-collapse font-sans text-[15px] leading-snug lg:text-base">
        <thead>
          <tr className="border-b-[1.5px] border-ink">
            {head.children.map((cell, i) => (
              <th key={i} scope="col" className="py-2 pe-4 text-start align-bottom font-bold last:pe-0">
                <Inlines nodes={cell.children} guide={guide} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-rule">
              {row.children.map((cell, i) => (
                <td key={i} className="py-2.5 pe-4 align-top text-pretty last:pe-0 first:font-semibold">
                  <Inlines nodes={cell.children} guide={guide} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ node, guide }: { node: RootContent; guide: Guide }) {
  switch (node.type) {
    case 'paragraph':
      return isPenParagraph(node) ? (
        <p data-anim="write" className="mt-4 font-pen font-medium text-pen first:mt-0">
          <Inlines nodes={node.children} guide={guide} />
        </p>
      ) : (
        <p className="mt-4 first:mt-0">
          <Inlines nodes={node.children} guide={guide} />
        </p>
      );
    case 'list':
      return node.ordered ? (
        <NotebookList node={node} guide={guide} />
      ) : (
        <ul className="mt-3 list-disc space-y-2 ps-5 marker:text-ink-soft">
          {node.children.map((item, i) => (
            <li key={i} className="ps-1">
              <ItemContent item={item} guide={guide} />
            </li>
          ))}
        </ul>
      );
    case 'table':
      return <GuideTable node={node} guide={guide} />;
    case 'heading':
      return (
        <h3 className="mt-7 text-[17px] leading-snug font-bold lg:text-lg">
          <Inlines nodes={node.children} guide={guide} />
        </h3>
      );
    case 'blockquote':
      return (
        <blockquote className="mt-4 border-s border-ink ps-4">
          <Blocks nodes={node.children} guide={guide} />
        </blockquote>
      );
    case 'thematicBreak':
      return <hr className="mt-8 border-rule" />;
    default:
      throw new Error(`guide-content: אין עיצוב ל-${node.type}`);
  }
}

export function Blocks({ nodes, guide }: { nodes: RootContent[]; guide: Guide }) {
  return nodes.map((node, i) => <Block key={i} node={node} guide={guide} />);
}
