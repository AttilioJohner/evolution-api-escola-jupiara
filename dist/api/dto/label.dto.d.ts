export declare class LabelDto {
    id?: string;
    name: string;
    color: string;
    predefinedId?: string;
}
export declare class HandleLabelDto {
    number: string;
    labelId: string;
    action: 'add' | 'remove';
}
